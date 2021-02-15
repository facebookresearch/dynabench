# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import os
from abc import ABC, abstractmethod

import boto3

from datasets.task_config import task_config
from eval_config import eval_config


logger = logging.getLogger("datasets")


class BaseDataset(ABC):
    def __init__(self, task, name, ext=".jsonl", s3_client=None):
        self.task = task
        self.name = name
        self.filename = self.name + ext
        self.s3_url = self._get_data_s3_url()
        self.s3_client = s3_client or boto3.client(
            "s3",
            aws_access_key_id=eval_config["aws_access_key_id"],
            aws_secret_access_key=eval_config["aws_secret_access_key"],
            region_name=eval_config["aws_region"],
        )
        if not self._dataset_available_on_s3():
            logger.info(
                f"Dataset {self.name} does not exist on S3. "
                f"Pushing to {self.s3_url} now..."
            )
            self.load()
            logger.info(f"Loaded {self.name} on S3 at {self.s3_url}")
        else:
            logger.info(f"Dataset {self.name} exists on S3 at {self.s3_url}")

    def _get_data_s3_path(self):
        return os.path.join("datasets", self.task, self.filename)

    def _get_data_s3_url(self):
        s3_path = self._get_data_s3_path()
        return os.path.join(f"s3://{eval_config['dataset_s3_bucket']}", s3_path)

    def _get_output_s3_path_prefix(self, endpoint_name):
        return os.path.join(
            f"s3://{eval_config['dataset_s3_bucket']}",
            "predictions",
            endpoint_name,
            self.task,
        )

    def _dataset_available_on_s3(self) -> bool:
        path = self._get_data_s3_path()
        response = self.s3_client.list_objects_v2(
            Bucket=eval_config["dataset_s3_bucket"], Prefix=path
        )
        for obj in response.get("Contents", []):
            if obj["Key"] == path:
                return True
        return False

    def get_output_s3_path(self, endpoint_name):
        prefix = self._get_output_s3_path_prefix(endpoint_name)
        return os.path.join(prefix, self.filename + ".out")

    def run_eval(self, sagemaker_client, endpoint_name, job_name) -> bool:
        # submit an evaluation job
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
                "S3OutputPath": self._get_output_s3_path_prefix(endpoint_name),
                "Accept": "application/json",
                "AssembleWith": "Line",
            },
            TransformResources={
                "InstanceType": task_config.get(self.task, task_config["default"])[
                    "instance_type"
                ],
                "InstanceCount": 1,
            },
        )
        return True

    def eval(self, predictions: list) -> dict:
        """
        Adapted from common.helpers.validate_prediction, compute accuracy / f1, etc.
        """
        eval_fn = task_config.get(self.task, task_config["default"])["eval_fn"]
        # TODO: following section, get labels from s3_url:
        # zoe to consider, here or implemented by task, or by dataset?
        target_examples = self.s3_url

        target_ids = {
            r_id: [x["id"] for x in target_examples[r_id]] for r_id in target_examples
        }
        target_labels = {
            r_id: [x["answer"] for x in target_examples[r_id]]
            for r_id in target_examples
        }
        target_tags = {
            r_id: [x["tags"] for x in target_examples[r_id]] for r_id in target_examples
        }
        # we are using SQuAD JSON format, so align the predictions with
        # the target labels
        # TODO: fix this after model I/O is confirmed
        aligned_prediction = []
        for r_id in sorted(target_examples):
            for id in target_ids[r_id]:
                if id in predictions:
                    aligned_prediction.append(predictions[id])
        predictions = aligned_prediction

        # validate prediction and target labels length
        # if len(r_objects) > 1 and len(predictions) !=
        # len(sum(target_labels.values(), [])):
        #     raise AssertionError("Prediction and target file length mismatch")
        # elif len(r_objects) == 1 and len(target_labels[r_objects[0].rid]) != len(
        #     predictions
        # ):
        #     raise AssertionError("Prediction and target file length mismatch")

        # overall_accuracy = 0
        # score_obj_list = []
        # rounds_accuracy_list = []

        # for r_obj in sorted(r_objects, key=lambda x: x.rid):
        score_obj = {}
        # round_accuracy = {} # TODO: no need of this since we don't send response?
        # score_obj["round_id"] = r_obj.id # TODO: what to do with rid for e.g. mnli?
        score_obj["desc"] = None
        score_obj["longdesc"] = None
        score_obj["metadata_json"] = {}

        # # Slice and extract round specific prediction
        # end_index = end_index + len(target_labels[r_obj.rid])
        # score_obj["start_index"] = start_index
        # score_obj["end_index"] = end_index
        # r_prediction = predictions[start_index:end_index]
        # start_index = end_index

        # Get round performance
        r_accuracy = eval_fn(predictions, target_labels)
        score_obj["pretty_perf"] = str(round(r_accuracy * 100, 2)) + " %"
        score_obj["perf"] = round(r_accuracy * 100, 2)
        # round_accuracy["accuracy"] = round(r_accuracy * 100, 2)

        # Get performance breakdown for this round across tags
        if target_tags:
            examples_by_tag = {}
            for r_pred, r_target_label, r_target_tags in zip(
                predictions, target_labels, target_tags
            ):
                for tag in r_target_tags:
                    examples_by_tag.setdefault(tag, []).append((r_pred, r_target_label))
            perf_by_tag = {
                k: eval_fn(*list(zip(*examples)))
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

            # Sum rounds accuracy and generate score object list
            # overall_accuracy = overall_accuracy + round(r_accuracy * 100, 2)
            # round_accuracy["round_id"] = r_obj.rid
            # rounds_accuracy_list.append(round_accuracy)
            # score_obj_list.append(score_obj)

        # if len(rounds_accuracy_list) > 0:
        # overall_accuracy /= len(rounds_accuracy_list)
        # FIXME: should move overall calculation
        # FIXME: to database level in current setup, not here

        # return rounds_accuracy_list, score_obj_list, round(overall_accuracy, 2)
        return score_obj

    @abstractmethod
    def load(self) -> bool:
        """
        this function loads the dataset to s3 and return True if succcessful
        """
        raise NotImplementedError
