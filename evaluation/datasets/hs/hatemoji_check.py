# Copyright (c) Facebook, Inc. and its affiliates.

import ast
import json
import os
import sys
import tempfile

import pandas as pd

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class HatemojiCheck(HsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(
            rootpath, "data", "hs/hatemoji_check/hatemoji_check.csv"
        )
        super().__init__(
            name="hatemoji-check", round_id=0, access_type=AccessTypeEnum.standard
        )

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
