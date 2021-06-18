# Copyright (c) Facebook, Inc. and its affiliates.

import ast
import json
import os
import sys
import tempfile

import pandas as pd

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class AdversarialHatemojiBase(HsBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.scoring
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for _, row in pd.read_csv(self.local_path).iterrows():
                    tmp_jl = {
                        "uid": row["eid"],
                        "statement": row["sentence"],
                        "label": {0: "not-hateful", 1: "hateful"}[row["label"]],
                        "tags": [{0: "not-hateful", 1: "hateful"}[row["label"]]]
                        + list(
                            filter(
                                lambda tag: tag != "none", ast.literal_eval(row["tags"])
                            )
                        ),
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


class AhsRound5Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r5_test.csv"
        )
        super().__init__(name="ahs-r5-test", local_path=local_path, round_id=5)


class AhsRound6Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r6_test.csv"
        )
        super().__init__(name="ahs-r6-test", local_path=local_path, round_id=6)


class AhsRound7Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r7_test.csv"
        )
        super().__init__(name="ahs-r7-test", local_path=local_path, round_id=7)


class AhsRound5Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r5_dev.csv"
        )
        super().__init__(
            name="ahs-r5-dev",
            local_path=local_path,
            round_id=5,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound6Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r6_dev.csv"
        )
        super().__init__(
            name="ahs-r6-dev",
            local_path=local_path,
            round_id=6,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound7Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r7_dev.csv"
        )
        super().__init__(
            name="ahs-r7-dev",
            local_path=local_path,
            round_id=7,
            access_type=AccessTypeEnum.standard,
        )
