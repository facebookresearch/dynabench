# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, SentimentBase


class Sst3Base(SentimentBase):
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
                        "statement": jl["sentence"],
                        "label": jl["gold_label"],
                    }
                    tmp.write(json.dumps(tmp_jl) + "\n")
                tmp.close()
                response = self.s3_client.upload_file(
                    tmp.name, self.task.s3_bucket, self._get_data_s3_path()
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


class Sst3Test(Sst3Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "sentiment/sst3/sst3-test.jsonl")
        super().__init__(name="sst3-test", local_path=local_path, round_id=0)


class Sst3Dev(Sst3Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "sentiment/sst3/sst3-dev.jsonl")
        super().__init__(
            name="sst3-dev",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )
