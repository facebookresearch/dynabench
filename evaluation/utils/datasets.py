# Copyright (c) Facebook, Inc. and its affiliates.

# to load the required dataset
import os


class BaseDataset:
    def __init__(self):
        self.task = None
        self.name = None
        self.s3_url = None

    def _get_data_s3_url(self, ext=".jsonl"):
        filename = self.name + ext
        return os.path.join("s3:", self.task, filename)

    def _get_output_s3_path(self, endpoint_name):
        return os.path.join("s3:", "bucket", endpoint_name, self.task)

    def load(self) -> str:
        # TODO: check if data does not exist then upload
        s3_url = self._get_data_s3_url()
        return s3_url

    def run_eval(self, client, endpoint_name, job_name) -> bool:
        # submit an evaluation job
        client.create_transform_job(
            ModelName=endpoint_name,
            TransformJobName=job_name,
            MaxConcurrentTransforms=1,
            BatchStrategy="SingleRecord",
            TransformInput={
                "DataSource": {
                    "S3DataSource": {"S3DataType": "S3Prefix", "S3Uri": self.load()}
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

    def eval(self, predictions: str) -> dict:
        # compute metrics on a given predictions file
        raise NotImplementedError


class AnliDevR1(BaseDataset):
    def __init__(self):
        self.task = "nli"
        self.name = "dev-r1"
        self.s3_url = self.load()


datasets = {"nli-dev-r1": AnliDevR1}
