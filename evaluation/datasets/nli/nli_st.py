# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class NLIStressTestBase(NliBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.standard
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                index = 0
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    if "pairID" in jl:
                        uid = jl["pairID"]
                    else:
                        uid = index
                    tmp_jl = {
                        "uid": uid,
                        "context": jl["sentence1"],
                        "hypothesis": jl["sentence2"],
                        "label": {
                            "entailment": "e",
                            "neutral": "n",
                            "contradiction": "c",
                        }[jl["gold_label"]],
                    }
                    tmp.write(json.dumps(tmp_jl) + "\n")
                    index += 1
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


class AntoynmMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Antonym/multinli_0.9_antonym_matched.jsonl",
        )
        super().__init__(
            name="nli-st-antonym-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class AntoynmMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Antonym/multinli_0.9_antonym_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-antonym-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class LengthMismatchMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Length_Mismatch/"
            + "multinli_0.9_length_mismatch_matched.jsonl",
        )
        super().__init__(
            name="nli-st-length-mismatch-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class LengthMismatchMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Length_Mismatch/"
            + "multinli_0.9_length_mismatch_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-length-mismatch-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class NegationMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Negation/multinli_0.9_negation_matched.jsonl",
        )
        super().__init__(
            name="nli-st-negation-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class NegationMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Negation/multinli_0.9_negation_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-negation-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class NumericalReasoning(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Numerical_Reasoning/multinli_0.9_quant_hard.jsonl",
        )
        super().__init__(
            name="nli-st-numerical-reasoning",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_swap_matched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_swap_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellContentMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_contentword_swap_perturbed_matched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-content-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellContentMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_contentword_swap_perturbed_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-content-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellFunctionMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_functionword_swap_perturbed_matched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-function-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellFunctionMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_functionword_swap_perturbed_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-function-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellKeyboardMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_keyboard_matched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-keyboard-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class MisspellKeyboardMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Spelling_Error/"
            + "multinli_0.9_dev_gram_keyboard_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-misspell-keyboard-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class WordOverlapMatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Word_Overlap/multinli_0.9_taut2_matched.jsonl",
        )
        super().__init__(
            name="nli-st-word-overlap-matched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )


class WordOverlapMismatched(NLIStressTestBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath,
            "data",
            "nli/Stress_Tests/Word_Overlap/multinli_0.9_taut2_mismatched.jsonl",
        )
        super().__init__(
            name="nli-st-word-overlap-mismatched",
            local_path=local_path,
            round_id=0,
            access_type=AccessTypeEnum.standard,
        )
