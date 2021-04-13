# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, SentimentBase


class AmazonReviewBase(SentimentBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.scoring
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["text_id"],
                        "context": jl["sentence"],
                        "label": jl["gold_label"],
                    }
                    tmp.write(json.dumps(tmp_jl) + "\n")
                tmp.close()
                response = self.s3_client.upload_file(
                    tmp.name, self.s3_bucket, self._get_data_s3_path()
                )
                os.remove(tmp.name)
                if response:
                    logger.info(response)
        except Exception as ex:
            logger.exception(f"Failed to load {self.name} to S3 due to {ex}.")
            return False
        else:
            return True

    def label_field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", []),
        }


class AmazonReviewTest(AmazonReviewBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "sentiment/amazon_review/amazon-review-test.jsonl"
        )
        super().__init__(name="amazon-review-test", local_path=local_path, round_id=0)


class AmazonReviewDev(AmazonReviewBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "sentiment/amazon_review/amazon-review-dev.jsonl"
        )
        super().__init__(
            name="amazon-review-dev",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )
