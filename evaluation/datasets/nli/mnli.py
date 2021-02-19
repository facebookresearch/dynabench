# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import BaseDataset, logger


class MnliBase(BaseDataset):
    def __init__(self, task, name, local_path):
        super().__init__(task=task, name=name)
        self.local_path = local_path

    def load(self, s3_client):
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
            response = s3_client.upload_file(
                tmp.name, self.s3_bucket, self._get_data_s3_path()
            )
            os.remove(tmp.name)
            if response:
                logger.info(response)

    def field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", ""),
        }


class MnliDevMismatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/mm_dev.jsonl")
        super().__init__(task="nli", name="mnli-dev-mismatched", local_path=local_path)


class MnliDevMatched(MnliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "nli/mnli/m_dev.jsonl")
        super().__init__(task="nli", name="mnli-dev-matched", local_path=local_path)
