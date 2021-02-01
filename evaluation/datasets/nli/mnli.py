# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import tempfile

from datasets.common import BaseDataset, logger
from eval_config import eval_config


class MnliDevMismatched(BaseDataset):
    def __init__(self):
        super().__init__(task="nli", name="mnli-dev-mismatched")

    def load(self):
        # TODO: discuss how to pass local_path (i.e. where to fetch original file)
        local_path = (
            "/Users/mazhiyi/Documents/Projects/"
            + "DYNABENCH/anli/data/build/mnli/mm_dev.jsonl"
        )
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
            for line in open(local_path).readlines():
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

    def eval(self, model):
        return {}


class MnliDevMatched(BaseDataset):
    def __init__(self):
        super().__init__(task="nli", name="mnli-dev-matched")

    def load(self):
        # TODO: discuss how to pass local_path (i.e. where to fetch original file)
        local_path = (
            "/Users/mazhiyi/Documents/Projects/"
            + "DYNABENCH/anli/data/build/mnli/m_dev.jsonl"
        )
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
            for line in open(local_path).readlines():
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

    def eval(self, model):
        return {}
