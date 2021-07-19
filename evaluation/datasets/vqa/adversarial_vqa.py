# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, VQABase


class AdversarialVQABase(VQABase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.scoring
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["question_id"],
                        "question": jl["question_str"],
                        "image_id": jl["image_id"],
                        "image_name": jl["image_name"],
                        "answers": jl["answers"],
                        "answer_type": jl["answer_type"],
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
            "answer": example["answers"],
            "tags": [example["answer_type"]],
        }


class AdVQARound1Test(AdversarialVQABase):
    def __init__(self):
        local_path = "vqa-r1-test-advqa.jsonl"
        super().__init__(name="vqa-r1-test-advqa", local_path=local_path, round_id=1)
