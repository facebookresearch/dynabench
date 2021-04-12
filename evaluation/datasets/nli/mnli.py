# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class MnliBase(NliBase):
    def __init__(self, name, local_path, access_type=AccessTypeEnum.scoring):
        self.local_path = local_path
        super().__init__(name=name, round_id=0, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    if jl["gold_label"] != "-":
                        tmp_jl = {
                            "uid": jl["pairID"],
                            "context": jl["sentence1"],
                            "hypothesis": jl["sentence2"],
                            "label": {
                                "entailment": "e",
                                "neutral": "n",
                                "contradiction": "c",
                            }[jl["gold_label"]],
                        }
                        tmp.write(json.dumps(tmp_jl) + "\n")
                tmp.close()
                response = self.s3_client.upload_file(
                    tmp.name, self.s3_bucket, self._get_data_s3_path()
                )
                print(self.name + " DATA UPLOADED :D :D :D")
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


class MnliDevMismatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/mm_dev.jsonl")
        super().__init__(
            name="mnli-dev-mismatched",
            local_path=local_path,
            access_type=AccessTypeEnum.standard,
        )


class MnliDevMatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/m_dev.jsonl")
        super().__init__(
            name="mnli-dev-matched",
            local_path=local_path,
            access_type=AccessTypeEnum.standard,
        )


class MnliTestMismatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/mm_test.jsonl")

        super().__init__(
            name="mnli-test-mismatched",
            local_path=local_path,
            access_type=AccessTypeEnum.standard,
        )


class MnliTestMatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/m_test.jsonl")
        super().__init__(
            name="mnli-test-matched",
            local_path=local_path,
            access_type=AccessTypeEnum.standard,
            )
