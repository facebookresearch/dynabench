# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import tempfile

from datasets.common import BaseDataset, logger
from eval_config import eval_config


class MnliBase(BaseDataset):
    def __init__(self, task, name, local_path):
        super().__init__(task=task, name=name)
        self.local_path = local_path

    def load(self):
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
            for line in open(self.local_path).readlines():
                jl = json.loads(line)
                tmp_jl = {
                    "uid": jl["uid"],
                    "context": jl["premise"],
                    "hypothesis": jl["hypothesis"],
                    "label": jl["label"].lower(),
                }
                tmp.write(json.dumps(tmp_jl) + "\n")
            tmp.close()
            response = self.s3_client.upload_file(
                tmp.name, eval_config["dataset_s3_bucket"], self._get_data_s3_path()
            )
            os.remove(tmp.name)
            if response:
                logger.info(response)


class MnliDevMismatched(MnliBase):
    def __init__(self):
        local_path = (
            "/Users/mazhiyi/Documents/Projects/"
            + "DYNABENCH/anli/data/build/mnli/mm_dev.jsonl"
        )
        super().__init__(task="nli", name="mnli-dev-mismatched", local_path=local_path)


class MnliDevMatched(MnliBase):
    def __init__(self):
        local_path = (
            "/Users/mazhiyi/Documents/Projects/"
            + "DYNABENCH/anli/data/build/mnli/m_dev.jsonl"
        )
        super().__init__(task="nli", name="mnli-dev-matched", local_path=local_path)
