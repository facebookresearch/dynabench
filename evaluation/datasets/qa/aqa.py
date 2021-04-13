# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, QaBase


class AqaBase(QaBase):
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
                        "uid": jl["id"],
                        "context": jl["context"],
                        "question": jl["question"],
                        "answer": jl["answers"][0]["text"],
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
            "answer": example["answer"],
            "tags": example.get("tags", []),
        }


class AqaRound1Test(AqaBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/aqa_v1.0/round1/test.jsonl")
        super().__init__(name="aqa-r1-test", local_path=local_path, round_id=1)


class AqaRound1Dev(AqaBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/aqa_v1.0/round1/dev.jsonl")
        super().__init__(
            name="aqa-r1-dev",
            local_path=local_path,
            round_id=1,
            access_type=AccessTypeEnum.standard,
        )
