# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import SentimentBase


class DynasentBase(SentimentBase):
    def __init__(self, task, name, local_path):
        self.local_path = local_path
        super().__init__(task=task, name=name, round_id=0)

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


class DynasentRound1Test(DynasentBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "sentiment/sentiment_v1.1/round1/test.jsonl"
        )
        super().__init__(
            task="sentiment", name="dynasent-r1-test", local_path=local_path
        )


class DynasentRound2Test(DynasentBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "sentiment/sentiment_v1.1/round2/test.jsonl"
        )
        super().__init__(
            task="sentiment", name="dynasent-r2-test", local_path=local_path
        )
