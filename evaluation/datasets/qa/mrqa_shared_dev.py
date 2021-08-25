# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, QaBase


class MrqaSharedDev(QaBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.standard
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                # First line is the header; disregard it.
                for line in open(self.local_path).readlines()[1:]:
                    jl = json.loads(line)
                    for qas in jl["qas"]:
                        tmp_jl = {
                            "uid": qas["qid"],
                            "context": jl["context"]
                            .replace("[TLE]", "")
                            .replace("[SEP]", "\n")
                            .replace("[PAR]", "\n\n"),
                            "question": qas["question"]
                            .replace("[TLE]", "")
                            .replace("[SEP]", "\n")
                            .replace("[PAR]", "\n\n"),
                            "answer": qas["answers"],
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
            "answer": example["answer"],
            "tags": example.get("tags", []),
        }


class BioAsq(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/BioASQ.jsonl")
        super().__init__(name="bio-asq-dev", local_path=local_path, round_id=0)


class Drop(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/DROP.jsonl")
        super().__init__(name="drop-dev", local_path=local_path, round_id=0)


class DuoRcParaphraseRc(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "qa/mrqa_shared_dev/DuoRC.ParaphraseRC.jsonl"
        )
        super().__init__(
            name="duo-rc-paraphrase-rc-dev", local_path=local_path, round_id=0
        )


class HotpotQa(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/HotpotQA.jsonl")
        super().__init__(name="hotpot-qa-dev", local_path=local_path, round_id=0)


class NaturalQuestionsShort(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "qa/mrqa_shared_dev/NaturalQuestionsShort.jsonl"
        )
        super().__init__(
            name="natural-questions-short-dev", local_path=local_path, round_id=0
        )


class NewsQa(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/NewsQA.jsonl")
        super().__init__(name="news-qa-dev", local_path=local_path, round_id=0)


class Race(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/RACE.jsonl")
        super().__init__(name="race-dev", local_path=local_path, round_id=0)


class RelationExtraction(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "qa/mrqa_shared_dev/RelationExtraction.jsonl"
        )
        super().__init__(
            name="relation-extraction-dev", local_path=local_path, round_id=0
        )


class SearchQa(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/SearchQA.jsonl")
        super().__init__(name="search-qa-dev", local_path=local_path, round_id=0)


class Squad(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "data", "qa/mrqa_shared_dev/SQuAD.jsonl")
        super().__init__(
            name="squad-dev",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.scoring,
        )


class TextbookQa(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "qa/mrqa_shared_dev/TextbookQA.jsonl"
        )
        super().__init__(name="textbook-qa-dev", local_path=local_path, round_id=0)


class TriviaQaWeb(MrqaSharedDev):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "qa/mrqa_shared_dev/TriviaQA-web.jsonl"
        )
        super().__init__(name="trivia-qa-web-dev", local_path=local_path, round_id=0)
