# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class SnliBase(NliBase):
    def __init__(self, name, local_path, access_type=AccessTypeEnum.scoring):
        self.local_path = local_path
        super().__init__(name=name, round_id=0, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    # If gold_label is -, then no annotators did not reach a
                    # majority agreement.
                    if jl["gold_label"] != "-":
                        tmp_jl = {
                            "uid": jl["pairID"],
                            "context": jl["sentence1"],
                            "hypothesis": jl["sentence2"],
                            "label": {
                                "entailment": "entailed",
                                "neutral": "neutral",
                                "contradiction": "contradictory",
                            }[jl["gold_label"]],
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


class SnliDev(SnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/snli_1.0/snli_1.0_dev.jsonl")
        super().__init__(
            name="snli-dev", local_path=local_path, access_type=AccessTypeEnum.standard
        )


class SnliTest(SnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/snli_1.0/snli_1.0_test.jsonl")
        super().__init__(name="snli-test", local_path=local_path)
