# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import os
from abc import ABC, abstractmethod

import boto3

from eval_config import eval_config


logger = logging.getLogger("datasets")


class BaseDataset(ABC):
    def __init__(self, task, name, s3_client=None):
        self.task = task
        self.name = name
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

    def _get_data_s3_path(self, ext=".jsonl"):
        filename = self.name + ext
        return os.path.join("datasets", self.task, filename)

    def _get_data_s3_url(self, ext=".jsonl"):
        s3_path = self._get_data_s3_path(ext)
        return os.path.join(f"s3://{eval_config['dataset_s3_bucket']}", s3_path)

    def _get_output_s3_path(self, endpoint_name):
        # TODO: update bucket
        return os.path.join("s3:", "bucket", endpoint_name, self.task)

    def _dataset_available_on_s3(self) -> bool:
        # TODO: check if data does not exist then upload
        path = self._get_data_s3_path()
        response = self.s3_client.list_objects_v2(
            Bucket=eval_config["dataset_s3_bucket"], Prefix=path
        )
        for obj in response.get("Contents", []):
            if obj["Key"] == path:
                return True
        return False

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
                "S3OutputPath": self._get_output_s3_path(endpoint_name),
                "Accept": "application/json",
                "AssembleWith": "Line",
            },
            TransformResources={"InstanceType": "ml.m5.xlarge", "InstanceCount": 1},
        )
        return True

    @abstractmethod
    def load(self) -> bool:
        """
        this function loads the dataset to s3 and return True if succcessful
        """
        raise NotImplementedError

    @abstractmethod
    def eval(self, predictions: str) -> dict:
        # compute metrics on a given predictions file
        raise NotImplementedError
