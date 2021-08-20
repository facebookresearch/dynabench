# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class Hans(NliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(
            rootpath, "data", "nli/hans/heuristics_evaluation_set.jsonl"
        )
        super().__init__(name="hans", round_id=0, access_type=AccessTypeEnum.standard)

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
                                "non-entailment": ["neutral", "contradictory"],
                            }[jl["gold_label"]],
                            "tags": [jl["heuristic"]],
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
