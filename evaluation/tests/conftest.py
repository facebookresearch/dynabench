# Copyright (c) Facebook, Inc. and its affiliates.

import boto3

import eval_config
from datasets.common import BaseDataset


# Makes sure to not use AWS secrets when running unit tests.
test_config = {
    "aws_access_key_id": "nope",
    "aws_secret_access_key": "nope",
    "aws_region": "nope",
    "dataset_s3_bucket": "nope",
    "sagemaker_role": "nope",
    "evaluation_sqs_queue": "nope",
    "scheduler_status_dump": "tests/scheduler.dump",
    "computer_status_dump": "tests/computer.dump",
    "eval_server_id": "unittest",
}

# TODO: we should use a diffent DB

eval_config.eval_config.update(test_config)

# Skips the code that check that the dataset are on S3 and in the DB
setattr(BaseDataset, "_ensure_model_on_s3", lambda self: None)


# Prevents from instantiating a S3 client
def no_s3_client(self):
    raise Exception("We shouldn't use S3 during testing")


setattr(boto3, "client", no_s3_client)
setattr(BaseDataset, "s3_client", property(no_s3_client))
