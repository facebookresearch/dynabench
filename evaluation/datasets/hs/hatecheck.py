# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class HateCheck(HsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(
            rootpath, "data", "hs/hatecheck/test_suite_cases_formatted.jsonl"
        )
        super().__init__(
            name="hatecheck", round_id=0, access_type=AccessTypeEnum.standard
        )

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(
                mode="w+", delete=False, encoding="utf-8"
            ) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["id"],
                        "statement": jl["text"],
                        "label": {"nothate": "not-hateful", "hate": "hateful"}[
                            jl["answer"]
                        ],
                        "tags": [jl["functionality"], jl["answer"]],
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
