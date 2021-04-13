# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import tempfile
from abc import ABC, abstractmethod

import boto3

from eval_config import eval_config
from metrics import get_eval_metrics, get_task_config_safe
from utils.helpers import (
    get_data_s3_path,
    get_perturbed_filename,
    path_available_on_s3,
    send_eval_request,
)


sys.path.append("../api")  # noqa
from models.dataset import DatasetModel, AccessTypeEnum  # isort:skip
from models.task import TaskModel  # isort:skip

logger = logging.getLogger("datasets")


class BaseDataset(ABC):
    def __init__(
        self,
        task,
        name,
        round_id,
        access_type=AccessTypeEnum.scoring,
        config=eval_config,
        ext=".jsonl",
    ):
        self.task = task
        self.name = name
        self.round_id = round_id
        self.access_type = access_type
        self.filename = self.name + ext
        self._n_examples = {}  # will be get through API
        self.s3_bucket = config["dataset_s3_bucket"]
        self.s3_url = self._get_data_s3_url()

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

        # Load dataset to S3 and register in db if not yet
        loaded = self.dataset_available_on_s3()
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
            self._register_dataset_in_db_and_eval(eval_config)

    def _get_data_s3_path(self, perturb_prefix=None):
        return get_data_s3_path(self.task, self.filename, perturb_prefix)

    def _get_data_s3_url(self, perturb_prefix=None):
        s3_path = self._get_data_s3_path(perturb_prefix)
        return os.path.join(f"s3://{self.s3_bucket}", s3_path)

    def _get_output_s3_url_prefix(self, endpoint_name):
        return os.path.join(
            f"s3://{self.s3_bucket}", "predictions", endpoint_name, self.task
        )

    def dataset_available_on_s3(self, perturb_prefix=None) -> bool:
        path = self._get_data_s3_path(perturb_prefix)
        return path_available_on_s3(self.s3_client, self.s3_bucket, path, path)

    def _register_dataset_in_db_and_eval(self, eval_config) -> bool:
        t = TaskModel()
        task_id = t.getByTaskCode(self.task).id
        d = DatasetModel()
        if not d.getByName(self.name):  # avoid id increment for unsuccessful creation
            if d.create(
                name=self.name,
                task_id=task_id,
                rid=self.round_id,
                access_type=self.access_type,
            ):
                logger.info(f"Registered {self.name} in datasets db.")
                send_eval_request(
                    model_id="*",
                    dataset_name=self.name,
                    config=eval_config,
                    logger=logger,
                )

    def get_output_s3_url(self, endpoint_name, perturb_prefix=None):
        prefix = self._get_output_s3_url_prefix(endpoint_name)
        filename = get_perturbed_filename(self.filename, perturb_prefix)
        return os.path.join(prefix, filename + ".out")

    def run_batch_transform(
        self, sagemaker_client, endpoint_name, job_name, perturb_prefix=None
    ) -> bool:
        # submit an evaluation job
        task_config = get_task_config_safe(self.task)
        sagemaker_client.create_transform_job(
            ModelName=endpoint_name,
            TransformJobName=job_name,
            MaxConcurrentTransforms=1,
            BatchStrategy="SingleRecord",
            TransformInput={
                "DataSource": {
                    "S3DataSource": {
                        "S3DataType": "S3Prefix",
                        "S3Uri": self._get_data_s3_url(perturb_prefix),
                    }
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
            DataProcessing={"InputFilter": f"${task_config['input_keys']}"},
        )
        return True

    def read_labels(self, perturb_prefix=None):
        tf = tempfile.mkstemp(prefix=self.name)[1]
        self.s3_client.download_file(
            self.s3_bucket, self._get_data_s3_path(perturb_prefix), tf
        )
        data = [json.loads(l) for l in open(tf).readlines()]
        labels = [self.label_field_converter(example) for example in data]
        os.remove(tf)
        if not self._n_examples.get(perturb_prefix, None):
            self._n_examples[perturb_prefix] = len(labels)
        return labels

    def get_n_examples(self, perturb_prefix=None):
        if not self._n_examples.get(perturb_prefix, None):
            self.read_labels(perturb_prefix)
        return self._n_examples[perturb_prefix]

    def eval(self, predictions: list, perturb_prefix=None) -> dict:
        """
        Adapted from common.helpers.validate_prediction, compute accuracy / f1, etc.
        """
        # load target examples
        target_examples = self.read_labels(perturb_prefix)
        # validate alignment of prediction and target labels
        target_ids = [x["id"] for x in target_examples]
        target_labels = {t["id"]: t["answer"] for t in target_examples}
        target_labels = [target_labels[id] for id in target_ids]
        target_tags = {t["id"]: t["tags"] for t in target_examples}
        target_tags = [target_tags[id] for id in target_ids]

        predictions = [
            self.pred_field_converter(prediction) for prediction in predictions
        ]
        predictions = {p["id"]: p["pred"] for p in predictions}
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

            # Get performance
            perf, perf_dict = get_eval_metrics(self.task, predictions, target_labels)
            score_obj["perf"] = perf
            score_obj["pretty_perf"] = str(perf) + " %"
            score_obj["metadata_json"] = perf_dict

            # Get performance breakdown for this round across tags
            if target_tags:
                examples_by_tag = {}
                for pred, target_label, target_tags in zip(
                    predictions, target_labels, target_tags
                ):
                    for tag in target_tags:
                        examples_by_tag.setdefault(tag, []).append((pred, target_label))
                perf_by_tag_tuple_dict = {
                    k: get_eval_metrics(self.task, *list(zip(*examples)))
                    for k, examples in examples_by_tag.items()
                }
                score_obj["metadata_json"]["perf_by_tag"] = [
                    {
                        "tag": tag,
                        "pretty_perf": str(perf * 100) + " %",
                        "perf": perf * 100,
                        "perf_dict": perf_dict,
                    }
                    for tag, (perf, perf_dict) in perf_by_tag_tuple_dict.items()
                ]

            score_obj["metadata_json"] = json.dumps(score_obj["metadata_json"])

            return score_obj

    @abstractmethod
    def load(self) -> bool:
        """
        This function loads the full dataset, including both input keys and labels keys,
        to s3 and return True if succcessful. Implemented on dataset level.
        The input keys must be consistent with the task config at metrics.task_config,
        the label keys will be consistent with those in self.label_field_converter,
        i.e. you can think of this function as a input_field_converter + send to S3
        """
        raise NotImplementedError

    @abstractmethod
    def label_field_converter(self, example):
        """
        Convert the example to a format expected by self.eval,
        the input is whatever that has been sent to S3, hence this function
        should normally be implemented on dataset level,
        and the output should have the following keys,
        {
            "id": <a unique identifier>,
            "answer": <the correct answer that will be used to calculate metrics>,
            "tags": <can be empty>
        }
        """
        raise NotImplementedError

    @abstractmethod
    def pred_field_converter(self, example):
        """
        Convert the prediction to a format expected by self.eval,
        the input follows the format of required handler output defined in Dynalab,
        hence this function should normally be implemented on task level,
        and the output should have the following keys
        {
            "id": <a unique identifier>,
            "pred": <the prediction that will be used to calculate metrics>,
        }
        """
        raise NotImplementedError
