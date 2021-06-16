# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class AnliBase(NliBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.scoring
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(
                mode="w+", delete=False, encoding="utf-8"
            ) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["uid"],
                        "context": jl["context"],
                        "hypothesis": jl["hypothesis"],
                        "label": {
                            "e": "entailed",
                            "n": "neutral",
                            "c": "contradictory",
                        }[jl["label"]],
                    }
                    tmp.write(json.dumps(tmp_jl, ensure_ascii=False) + "\n")
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


class AnliRound1Dev(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R1/dev.jsonl")
        super().__init__(
            name="anli-r1-dev",
            local_path=local_path,
            round_id=1,
            access_type=AccessTypeEnum.standard,
        )


class AnliRound1Test(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R1/test.jsonl")
        super().__init__(name="anli-r1-test", local_path=local_path, round_id=1)


class AnliRound2Dev(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R2/dev.jsonl")
        super().__init__(
            name="anli-r2-dev",
            local_path=local_path,
            round_id=2,
            access_type=AccessTypeEnum.standard,
        )


class AnliRound2Test(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R2/test.jsonl")
        super().__init__(name="anli-r2-test", local_path=local_path, round_id=2)


class AnliRound3Dev(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R3/dev.jsonl")
        super().__init__(
            name="anli-r3-dev",
            local_path=local_path,
            round_id=3,
            access_type=AccessTypeEnum.standard,
        )


class AnliRound3Test(AnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/anli_v1.0/R3/test.jsonl")
        super().__init__(name="anli-r3-test", local_path=local_path, round_id=3)
