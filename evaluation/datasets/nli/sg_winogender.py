# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class SuperglueWinogender(NliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(
            rootpath, "data", "nli/superglue_winogender/AX-g.jsonl"
        )
        source_url = "https://www.aclweb.org/anthology/N18-2002/"
        longdesc = (
            'The Winogender dataset from "Gender Bias in Coreference'
            + ' Resolution". It is the version from SuperGLUE, which has been'
            + " converted into a binary NLI task (entailment, not entailment)."
        )
        super().__init__(
            name="superglue-winogender",
            round_id=0,
            access_type=AccessTypeEnum.standard,
            longdesc=longdesc,
            source_url=source_url,
        )

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    # If gold_label is -, then no annotators did not reach a
                    # majority agreement.
                    tmp_jl = {
                        "uid": jl["pair_id"],
                        "context": jl["premise"],
                        "hypothesis": jl["hypothesis"],
                        "label": {
                            "entailment": "entailed",
                            "not_entailment": ["neutral", "contradictory"],
                        }[jl["label"]],
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
