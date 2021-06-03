# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import tempfile
from abc import ABC, abstractmethod

import boto3

from eval_config import eval_config
from metrics import get_delta_metrics, get_eval_metrics, get_task_config_safe
from models.dataset import AccessTypeEnum, DatasetModel
from models.task import TaskModel
from utils.helpers import (
    get_data_s3_path,
    get_perturbed_filename,
    path_available_on_s3,
    send_eval_request,
)


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
        longdesc=None,
        source_url=None,
    ):
        self.task = task
        self.name = name
        self.round_id = round_id
        self.access_type = access_type
        self.filename = self.name + ext
        self._n_examples = {}  # will be get through API
        self.task_config = get_task_config_safe(self.task)
        self.s3_bucket = self.task_config["s3_bucket"]
        self.s3_url = self._get_data_s3_url()
        self.longdesc = longdesc
        self.source_url = source_url

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
            if loaded:
                logger.info(f"Loaded {self.name} on S3 at {self.s3_url}")
            else:
                logger.exception(f"Failed to load {self.name} to S3")
        else:
            logger.info(f"Dataset {self.name} exists on S3 at {self.s3_url}")

        if loaded:
            self._register_dataset_in_db_and_eval(eval_config)

    def s3_path(self, *parts: str) -> str:
        return f"s3://{self.s3_bucket}/" + "/".join(parts)

    def _get_data_s3_path(self, perturb_prefix=None):
        return get_data_s3_path(self.task, self.filename, perturb_prefix)

    def _get_data_s3_url(self, perturb_prefix=None):
        return self.s3_path(self._get_data_s3_path(perturb_prefix))

    def _get_output_s3_url_prefix(self, endpoint_name):
        return self.s3_path("predictions", endpoint_name, self.task)

    def _get_raw_output_s3_url_prefix(self, endpoint_name):
        return self.s3_path("predictions", endpoint_name, "raw", self.task)

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
                longdesc=self.longdesc,
                source_url=self.source_url,
            ):
                logger.info(f"Registered {self.name} in datasets db.")
                send_eval_request(
                    model_id="*",
                    dataset_name=self.name,
                    config=eval_config,
                    logger=logger,
                )

    def get_output_s3_url(self, endpoint_name, raw=False, perturb_prefix=None):
        if raw:
            prefix = self._get_raw_output_s3_url_prefix(endpoint_name)
        else:
            prefix = self._get_output_s3_url_prefix(endpoint_name)
        filename = get_perturbed_filename(self.filename, perturb_prefix)
        return os.path.join(prefix, filename + ".out")

    def run_batch_transform(
        self, sagemaker_client, endpoint_name, job_name, perturb_prefix=None
    ) -> bool:
        """Submit an evaluation job"""
        task_config = get_task_config_safe(self.task)
        logger.debug(f"Will create transform job {job_name} with config: {task_config}")
        batch_transform_config = self.get_batch_transform_config(
            sagemaker_client, endpoint_name, job_name, perturb_prefix
        )
        sagemaker_client.create_transform_job(**batch_transform_config)
        return True

    def get_batch_transform_config(
        self, sagemaker_client, endpoint_name, job_name, perturb_prefix=None
    ) -> dict:
        task_config = get_task_config_safe(self.task)
        return dict(
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
                "S3OutputPath": self._get_raw_output_s3_url_prefix(endpoint_name),
                "Accept": "application/json",
                "AssembleWith": "Line",
            },
            TransformResources={
                "InstanceType": task_config["instance_config"]["instance_type"],
                "InstanceCount": task_config["instance_count"],
            },
            DataProcessing={"InputFilter": f"${task_config['input_keys']}"},
        )

    def read_labels(self, perturb_prefix=None):
        tf = tempfile.mkstemp(prefix=self.name)[1]
        self.s3_client.download_file(
            self.s3_bucket, self._get_data_s3_path(perturb_prefix), tf
        )
        data = [json.loads(l) for l in open(tf).readlines()]
        if perturb_prefix:
            labels = [self.perturb_label_field_converter(example) for example in data]
        else:
            labels = [self.label_field_converter(example) for example in data]
        os.remove(tf)
        if not self._n_examples.get(perturb_prefix, None):
            self._n_examples[perturb_prefix] = len(labels)
        return labels

    def get_n_examples(self, perturb_prefix=None):
        if not self._n_examples.get(perturb_prefix, None):
            self.read_labels(perturb_prefix)
        return self._n_examples[perturb_prefix]

    def eval(self, predictions: list, targets=None, perturb_prefix=None) -> dict:
        """
        Adapted from common.helpers.validate_prediction, compute accuracy / f1, etc.
        If targets is passed, will compute weighted delta metrics against
        the given target, and the target id should be original id
        """
        # load target examples
        target_examples = self.read_labels(perturb_prefix) if not targets else targets
        target_ids = [x["id"] for x in target_examples]
        # note to compute accuracy with changed label,
        # each perturbed example needs to have a unique id too
        target_labels = {t["id"]: t["answer"] for t in target_examples}
        target_labels = [target_labels[id] for id in target_ids]
        target_tags = {t["id"]: t["tags"] for t in target_examples}
        target_tags = [target_tags[id] for id in target_ids]

        predictions = [
            self.pred_field_converter(prediction) for prediction in predictions
        ]

        score_obj = {}  # score_obj keys always correspond to scores table columns

        if targets and perturb_prefix:  # i.e compute perturb percentage
            predictions_dict = {id: [] for id in target_ids}
            try:
                id_mapping = self.read_labels(perturb_prefix)
                id_mapping = {m["id"]: m["input_id"] for m in id_mapping}
                for p in predictions:
                    predictions_dict[id_mapping[p["id"]]].append(p["pred"])
                predictions = [predictions_dict[id] for id in target_ids]
            except KeyError as ex:
                logger.exception(f"Prediction and target file example mismatch: {ex}")
            except Exception as ex:
                logger.exception(f"Unknown exception {ex}")
            else:
                delta_metrics_dict = get_delta_metrics(
                    self.task, predictions, target_labels, perturb_prefix
                )
                score_obj = {
                    **delta_metrics_dict,
                    "metadata_json": json.dumps(delta_metrics_dict),
                }

        else:  # compute normal eval metrics
            # validate alignment of prediction and target labels
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
                # Get performance
                perf, perf_dict = get_eval_metrics(
                    self.task, predictions, target_labels
                )
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
                            examples_by_tag.setdefault(tag, []).append(
                                (pred, target_label)
                            )
                    perf_by_tag_tuple_dict = {
                        k: get_eval_metrics(self.task, *list(zip(*examples)))
                        for k, examples in examples_by_tag.items()
                    }
                    score_obj["metadata_json"]["perf_by_tag"] = [
                        {
                            "tag": tag,
                            "pretty_perf": str(perf) + " %",
                            "perf": perf,
                            "perf_dict": perf_dict,
                        }
                        for tag, (perf, perf_dict) in perf_by_tag_tuple_dict.items()
                    ]

                score_obj["metadata_json"] = json.dumps(score_obj["metadata_json"])

        return score_obj

    def perturb_label_field_converter(self, example):
        return {"input_id": example["input_id"], **self.label_field_converter(example)}

    def pred_to_target_converter(self, pred):
        """
        Used for fairness and robustness to compute
        unperturbed percentage on output
        """
        pred["answer"] = pred.pop("pred")
        pred["tags"] = []
        return pred

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
            "tags": <list of string, can be empty>
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
