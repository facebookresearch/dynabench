# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class AhsBase(HsBase):
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
        super().__init__(name="hs-r1-test", local_path=local_path, round_id=1)


class AhsRound2Test(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R2/test.jsonl")
        super().__init__(name="hs-r2-test", local_path=local_path, round_id=2)


class AhsRound3Test(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R3/test.jsonl")
        super().__init__(name="hs-r3-test", local_path=local_path, round_id=3)


class AhsRound1Dev(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R1/dev.jsonl")
        super().__init__(
            name="hs-r1-dev",
            local_path=local_path,
            round_id=1,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound2Dev(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R2/dev.jsonl")
        super().__init__(
            name="hs-r2-dev",
            local_path=local_path,
            round_id=2,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound3Dev(AhsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "hs/hate_speech_v0.1/R3/dev.jsonl")
        super().__init__(
            name="hs-r3-dev",
            local_path=local_path,
            round_id=3,
            access_type=AccessTypeEnum.standard,
        )
