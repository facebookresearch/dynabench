# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import os
import random
import time
import zlib
from collections import defaultdict
from typing import Any, Callable, Dict, List, Optional

import spacy
import augly.text as textaugs
from augly.utils import pathmgr
from util import postprocess, preprocess


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("perturb")


class AuglyPerturbation:
    def __init__(
        self,
        perturb_prefix: str,
        task: str,
        seed: Optional[int],
        log_every_n: int,
        skip_ents=True,
    ):
        if skip_ents:
            self.ner = spacy.load("en_core_web_sm")
            self.skip_ents = True
        else:
            self.skip_ents = False
        self.perturb_prefix = perturb_prefix
        self.task = task
        self.seed = seed if seed is not None else random.randint(0, 1000)
        random.seed(self.seed)
        self.perturbations = self.get_perturbations()
        self.log_every_n = log_every_n if log_every_n > 0 else None

    def get_names_mapping(self, names: List[str]) -> Dict[str, str]:
        for i, names_i in enumerate(names):
            with pathmgr.open(names_i) as f:
                names[i] = [str(n) for n in f.read().splitlines()]

        # Build random pairs
        name_mapping = {}
        for i in range(len(names)):
            for name in names[i]:
                new_group = i
                while new_group == i:
                    new_group = random.randint(0, len(names) - 1)
                idx = random.randint(0, len(names[new_group]) - 1)
                name_mapping[name] = names[new_group][idx]

        return name_mapping

    def get_perturbations(self) -> Dict[str, List[Dict[str, Any]]]:
        fdir = "./data/"

        if self.perturb_prefix == "fairness":
            return [
                {
                    "aug_word_p": 1.0,
                    "class": "ReplaceWords",
                    "mapping": self.get_names_mapping(
                        [
                            os.path.join(fdir, "api_names.txt"),
                            os.path.join(fdir, "black_names.txt"),
                            os.path.join(fdir, "hispanic_names.txt"),
                            os.path.join(fdir, "white_names.txt"),
                        ]
                    ),
                    "name": "SwapEthnicGroupNames",
                },
                {
                    "aug_word_p": 1.0,
                    "class": "ReplaceWords",
                    "mapping": self.get_names_mapping(
                        [
                            os.path.join(fdir, "male_names.txt"),
                            os.path.join(fdir, "female_names.txt"),
                        ]
                    ),
                    "name": "SwapGenderedNames",
                },
                {"aug_word_p": 1.0, "class": "SwapGenderedWords"},
            ]

        return [
            # TODO: should ChangeCase not be used for QA? (wasn't in the old version of this script)
            {"class": "ChangeCase", "case": "upper", "cadence": 3.0},
            {"class": "Contractions", "aug_p": 1.0},
            {"class": "InsertPunctuationChars", "cadence": 10.0, "vary_chars": True},
            {"class": "InsertWhitespaceChars", "cadence": 10.0, "vary_chars": True},
            {"class": "InsertZeroWidthChars", "cadence": 10.0, "vary_chars": True},
            # TODO: improve efficiency of these augmentations
            # {"class": "ReplaceFunFonts", "vary_fonts": True}, (currently 0.2s/example)
            # {"class": "ReplaceSimilarUnicodeChars"}, (currently 0.2s/example)
            # {"class": "ReplaceUpsideDown", "granularity": "word"}, (currently 0.2s/example)
            # {"class": "SimulateTypos", "typo_type": "charmix", "name": "CharTypos"}, (currently 3s/example)
            # {
            #     "class": "SimulateTypos",
            #     "typo_type": "keyboard",
            #     "name": "KeyboardTypos",
            # }, (currently 3s/example)
            # {
            #     "class": "SimulateTypos",
            #     "typo_type": "misspelling",
            #     "name": "MisspellingTypos",
            # }, (currently 0.2s/example)
            # {"class": "SplitWords"}, (currently 0.2s/example)
        ]

    def get_entity_set(self, text: str) -> Optional[List[str]]:
        if self.skip_ents:
            doc = self.ner(text)
            return [ent.text for ent in doc.ents]
        else:
            return None

    def perturb(self, examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        num_examples = len(examples)
        perturbed = defaultdict(list)
        for perturbation in self.perturbations:
            aug_kwargs = perturbation.copy()
            class_name = aug_kwargs.pop("class")
            transform_name = aug_kwargs.pop("name", None) or class_name
            transform = getattr(textaugs, class_name)(**aug_kwargs)

            logger.info(f"Applying {transform_name} transform to {num_examples} examples")
            t0 = time.time()
            for i, example in enumerate(examples):
                pt_example = self.apply_augmentation(transform, example, transform_name)
                if (i + 1) % self.log_every_n == 0:
                    logger.info(
                        f"Perturbed {i + 1}/{num_examples} examples with "
                        f"{transform_name}; took "
                        f"{(time.time() - t0) / (i + 1)}s/example"
                    )

                if pt_example:
                    perturbed[example["uid"]].append(pt_example)

            logger.info(
                f"Finished perturbing {num_examples} examples with "
                f"{transform_name}; took {time.time() - t0}s "
                f"({(time.time() - t0) / num_examples}s/example)"
            )

        # Sort examples by UID before returning so they will be grouped by example,
        # not by perturbation type
        return [ex for v in perturbed.values() for ex in v]

    def apply_augmentation(
        self, transform: Callable, example: Dict[str, Any], transform_name: str
    ) -> Optional[Dict[str, Any]]:
        kwargs = {}
        if self.perturb_prefix == "fairness":
            kwargs["ignore_words"] = self.get_entity_set(text)

        perturb_example = example.copy()
        perturb_example["input_id"] = example["uid"]
        perturb_example["uid"] = f"{example['uid']}_{transform_name}"

        uid_hash = zlib.adler32(perturb_example["uid"].encode())
        random.seed((self.seed + uid_hash) % 2 ** 32)

        # Perturb context for all tasks if it exists
        if "context" in example:
            self.call_transform(example, perturb_example, "context", transform)

        # Perturb statement for hs and sentiment
        if self.task in ["hs", "sentiment"]:
            self.call_transform(example, perturb_example, "statement", transform)

        # Perturb additional fields for task "qa" and "nli"
        if self.task == "qa":
            ans = example["answer"]
            if isinstance(ans, str):
                ans = [ans]
            if "ignore_words" in kwargs:
                kwargs["ignore_words"] = kwargs["ignore_words"] + ans
            self.call_transform(example, perturb_example, "question", transform)
        elif self.task == "nli":
            self.call_transform(example, perturb_example, "hypothesis", transform)

        if perturb_example != example:
            return perturb_example

        return None

    def call_transform(
        self,
        src_example: Dict[str, Any],
        aug_example: Dict[str, Any],
        key: str,
        transform: Callable,
        **kwargs,
    ) -> None:
        text = src_example[key]
        text = preprocess(text)

        # TODO: make ignore_words an arg to __call__()
        aug_text = transform(text, kwargs)

        if isinstance(aug_text, List):
            assert len(aug_text) == 1
            aug_text = aug_text[0]

        aug_example[key] = postprocess(aug_text)
