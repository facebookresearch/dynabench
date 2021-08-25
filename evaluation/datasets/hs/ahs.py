# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

import pandas as pd

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class AhsBase(HsBase):
    def __init__(self, name, split, round_id=0, access_type=AccessTypeEnum.scoring):
        self.split = split
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(rootpath, "data", "hs/ahs/final_ahs_dataset.csv")
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for _, row in pd.read_csv(self.local_path).iterrows():
                    if (
                        row["round.base"] == self.round_id
                        and row["split"] == self.split
                    ):
                        tmp_jl = {
                            "uid": row["acl.id"],
                            "statement": row["text"],
                            "label": {"nothate": "not-hateful", "hate": "hateful"}[
                                row["label"]
                            ],
                            "tags": [row["label"]],
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


class AhsRound1Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r1-test", split="test", round_id=1)


class AhsRound2Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r2-test", split="test", round_id=2)


class AhsRound3Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r3-test", split="test", round_id=3)


class AhsRound4Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r4-test", split="test", round_id=4)


class AhsRound1Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r1-dev",
            split="dev",
            round_id=1,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound2Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r2-dev",
            split="dev",
            round_id=2,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound3Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r3-dev",
            split="dev",
            round_id=3,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound4Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r4-dev",
            split="dev",
            round_id=4,
            access_type=AccessTypeEnum.standard,
        )
