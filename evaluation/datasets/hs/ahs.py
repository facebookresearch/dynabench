# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import HsBase


class AhsBase(HsBase):
    def __init__(self, task, name, local_path):
        self.local_path = local_path
        super().__init__(task=task, name=name, round_id=0)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["id"],
                        "context": jl["text"],
                        "label": jl["answer"],
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


class AhsRound1Test(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R1/test.jsonl")
        super().__init__(task="hs", name="hs-r1-test", local_path=local_path)


class AhsRound2Test(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R2/test.jsonl")
        super().__init__(task="hs", name="hs-r2-test", local_path=local_path)


class AhsRound3Test(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R3/test.jsonl")
        super().__init__(task="hs", name="hs-r3-test", local_path=local_path)
