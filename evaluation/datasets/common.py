# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import sys
import tempfile
from abc import ABC, abstractmethod

import boto3

from eval_config import eval_config
from metrics import get_eval_metrics, tasks_config


sys.path.append("../api")  # noqa
from models.dataset import DatasetModel  # isort:skip
from models.task import TaskModel  # isort:skip

logger = logging.getLogger("datasets")


class BaseDataset(ABC):
    def __init__(self, task, name, round_id=0, config=eval_config, ext=".jsonl"):
        self.task = task
        self.name = name
        self.round_id = round_id
        self.filename = self.name + ext
        self._n_examples = None  # will be get through API
        self.s3_bucket = config["dataset_s3_bucket"]
        self.s3_url = self._get_data_s3_url()

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

        # Load dataset to S3 and register in db if not yet
        loaded = self._dataset_available_on_s3()
        if not loaded:
            logger.info(
                f"Dataset {self.name} does not exist on S3. "
                f"Pushing to {self.s3_url} now..."
            )
            loaded = self.load()
            logger.info(f"Loaded {self.name} on S3 at {self.s3_url}")
        else:
            logger.info(f"Dataset {self.name} exists on S3 at {self.s3_url}")

        if loaded:
            self._register_dataset_in_db()

    def _get_data_s3_path(self):
        return os.path.join("datasets", self.task, self.filename)

    def _get_data_s3_url(self):
        s3_path = self._get_data_s3_path()
        return os.path.join(f"s3://{self.s3_bucket}", s3_path)

    def _get_output_s3_url_prefix(self, endpoint_name):
        return os.path.join(
            f"s3://{self.s3_bucket}", "predictions", endpoint_name, self.task
        )

    def _dataset_available_on_s3(self) -> bool:
        path = self._get_data_s3_path()
        response = self.s3_client.list_objects_v2(Bucket=self.s3_bucket, Prefix=path)
        for obj in response.get("Contents", []):
            if obj["Key"] == path:
                return True
        return False

    def _register_dataset_in_db(self) -> bool:
        d = DatasetModel()
        if not d.getByName(self.name):
            t = TaskModel()
            task_id = t.getByTaskCode(self.task).id
            d.create(name=self.name, task_id=task_id, rid=self.round_id)

    def get_output_s3_url(self, endpoint_name):
        prefix = self._get_output_s3_url_prefix(endpoint_name)
        return os.path.join(prefix, self.filename + ".out")

    def run_batch_transform(self, sagemaker_client, endpoint_name, job_name) -> bool:
        # submit an evaluation job
        task_config = tasks_config.get(self.task, tasks_config["default"])
        sagemaker_client.create_transform_job(
            ModelName=endpoint_name,
            TransformJobName=job_name,
            MaxConcurrentTransforms=1,
            BatchStrategy="SingleRecord",
            TransformInput={
                "DataSource": {
                    "S3DataSource": {"S3DataType": "S3Prefix", "S3Uri": self.s3_url}
                },
                "ContentType": "application/json",
                "SplitType": "Line",
            },
            TransformOutput={
                # change to config
                "S3OutputPath": self._get_output_s3_url_prefix(endpoint_name),
                "Accept": "application/json",
                "AssembleWith": "Line",
            },
            TransformResources={
                "InstanceType": task_config["instance_config"]["instance_type"],
                "InstanceCount": task_config["instance_count"],
            },
        )
        return True

    def read_labels(self):
        tf = tempfile.mkstemp(prefix=self.name)[1]
        self.s3_client.download_file(self.s3_bucket, self._get_data_s3_path(), tf)
        data = [json.loads(l) for l in open(tf).readlines()]
        labels = [self.field_converter(example) for example in data]
        os.remove(tf)
        if not self._n_examples:
            self._n_examples = len(labels)
        return labels

    def get_n_examples(self):
        if not self._n_examples:
            self.read_labels()
        return self._n_examples

    def eval(self, predictions: list) -> dict:
        """
        Adapted from common.helpers.validate_prediction, compute accuracy / f1, etc.
        """
        # load target examples
        target_examples = self.read_labels()
        # validate alignment of prediction and target labels
        target_ids = [x["id"] for x in target_examples]
        target_labels = {t["id"]: t["answer"] for t in target_examples}
        target_labels = [target_labels[id] for id in target_ids]
        target_tags = {t["id"]: t["tags"] for t in target_examples}
        target_tags = [target_tags[id] for id in target_ids]

        predictions = {p["id"]: p["label"] for p in predictions}
        try:
            predictions = [predictions[id] for id in target_ids]
            assert len(predictions) == len(target_labels)
        except AssertionError:
            logger.exception("Prediction and target file length mismatch")
        except KeyError as ex:
            logger.exception(f"Prediction and target file example mismatch: {ex}")
        except Exception as ex:
            logger.exception(f"Unknown exception {ex}")
        else:
            score_obj = {}
            score_obj["round_id"] = self.round_id

            # Get performance
            perf, perf_dict = get_eval_metrics(self.task, predictions, target_labels)
            score_obj["perf"] = round(perf * 100, 2)
            score_obj["pretty_perf"] = str(round(perf * 100, 2)) + " %"
            score_obj["metadata_json"] = perf_dict

            # Get performance breakdown for this round across tags
            if target_tags:
                examples_by_tag = {}
                for pred, target_label, target_tags in zip(
                    predictions, target_labels, target_tags
                ):
                    for tag in target_tags:
                        examples_by_tag.setdefault(tag, []).append((pred, target_label))
                perf_by_tag = {
                    k: get_eval_metrics(self.task, *list(zip(*examples)))
                    for k, examples in examples_by_tag.items()
                }
                score_obj["metadata_json"]["perf_by_tag"] = [
                    {
                        "tag": tag,
                        "pretty_perf": str(round(perf * 100, 2)) + " %",
                        "perf": round(perf * 100, 2),
                    }
                    for tag, perf in perf_by_tag.items()
                ]
            score_obj["metadata_json"] = json.dumps(score_obj["metadata_json"])

            return score_obj

    @abstractmethod
    def load(self) -> bool:
        """
        this function loads the dataset to s3 and return True if succcessful
        """
        raise NotImplementedError

    @abstractmethod
    def field_converter(self, example):
        """
        convert the example to a format expected by eval.
        A converted example should look like
        {
            "id": <a unique identifier>,
            "answer": <e.g. a label>,
            "tag": <can be empty>
        }
        """
        raise NotImplementedError
