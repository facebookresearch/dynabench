# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, NliBase


class NLIStressTest(NliBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_paths_and_tag_names = [
            (os.path.join(rootpath, "data", path), tag)
            for path, tag in [
                (
                    "nli/Stress_Tests/Antonym/multinli_0.9_antonym_matched.jsonl",
                    "antonym-matched",
                ),
                (
                    "nli/Stress_Tests/Antonym/multinli_0.9_antonym_mismatched.jsonl",
                    "antonym-mismatched",
                ),
                (
                    "nli/Stress_Tests/Length_Mismatch/multinli_0.9_length_"
                    + "mismatch_matched.jsonl",
                    "length-mismatch-matched",
                ),
                (
                    "nli/Stress_Tests/Length_Mismatch/multinli_0.9_length_"
                    + "mismatch_matched.jsonl",
                    "length-mismatch-mismatched",
                ),
                (
                    "nli/Stress_Tests/Negation/multinli_0.9_negation_matched.jsonl",
                    "negation-matched",
                ),
                (
                    "nli/Stress_Tests/Negation/multinli_0.9_negation_mismatched.jsonl",
                    "negation-mismatched",
                ),
                (
                    "nli/Stress_Tests/Numerical_Reasoning/multinli_0.9_quant_"
                    + "hard.jsonl",
                    "numerical-reasoning",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "swap_matched.jsonl",
                    "misspell-matched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "swap_mismatched.jsonl",
                    "misspell-mismatched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "contentword_swap_perturbed_matched.jsonl",
                    "misspell-content-matched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "contentword_swap_perturbed_mismatched.jsonl",
                    "misspell-content-mismatched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "functionword_swap_perturbed_matched.jsonl",
                    "misspell-function-matched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "functionword_swap_perturbed_mismatched.jsonl",
                    "misspell-function-mismatched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "keyboard_matched.jsonl",
                    "nli-st-misspell-keyboard-matched",
                ),
                (
                    "nli/Stress_Tests/Spelling_Error/multinli_0.9_dev_gram_"
                    + "keyboard_mismatched.jsonl",
                    "nli-st-misspell-keyboard-mismatched",
                ),
                (
                    "nli/Stress_Tests/Word_Overlap/multinli_0.9_taut2_matched.jsonl",
                    "nli-st-word-overlap-matched",
                ),
                (
                    "nli/Stress_Tests/Word_Overlap/multinli_0.9_taut2_mismatched.jsonl",
                    "nli-st-word-overlap-mismatched",
                ),
            ]
        ]
        super().__init__(
            name="nli-stress-test", round_id=0, access_type=AccessTypeEnum.standard
        )

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(
                mode="w+", delete=False, encoding="utf-8"
            ) as tmp:
                index = 0
                for local_path, tag_name in self.local_paths_and_tag_names:
                    for line in open(local_path).readlines():
                        jl = json.loads(line)
                        uid = str(index)
                        tmp_jl = {
                            "uid": uid,
                            "context": jl["sentence1"],
                            "hypothesis": jl["sentence2"],
                            "label": {
                                "entailment": "entailed",
                                "neutral": "neutral",
                                "contradiction": "contradictory",
                            }[jl["gold_label"]],
                            "tags": [tag_name],
                        }
                        tmp.write(json.dumps(tmp_jl, ensure_ascii=False) + "\n")
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
