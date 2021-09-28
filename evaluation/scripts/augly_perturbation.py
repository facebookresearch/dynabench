# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import random
from typing import Any, Callable, Dict, List, Optional

import spacy
import augly.text as textaugs
from augly.utils import pathmgr
from util import postprocess, preprocess


class AuglyPerturbation:
    def __init__(
        self, perturb_prefix: str, task: str, seed: Optional[int] = None, skip_ents=True
    ):
        if skip_ents:
            self.ner = spacy.load("en_core_web_sm")
            self.skip_ents = True
        else:
            self.skip_ents = False
        self.perturb_prefix = perturb_prefix
        self.task = task
        self.rng = np.random.RandomState(seed) if seed is not None else np.random
        self.perturbations = self.get_perturbations()
    
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
                            os.path.join(fdir, "male_names.txt"),
                            os.path.join(fdir, "female_names.txt"),
                        ]
                    ),
                    "name": "SwapGenderedWords",
                },
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
                    "name": "SwapEthnicGroupWords",
                },
                {"aug_word_p": 1.0, "class": "SwapGenderedWords"},
            ]
        
        return [
            # TODO: should ChangeCase not be used for QA? (like in old version)
            {"class": "ChangeCase", "cadence": 3.0, "seed": self.rng.sample(0, 1000)},
            {"class": "Contractions", "aug_word_p": 1.0},
            {"class": "InsertPunctuationChars"},
            {"class": "InsertWhitespaceChars"},
            {"class": "InsertZeroWidthChars"},
            {"class": "ReplaceFunFonts"},
            {"class": "ReplaceSimilarUnicodeChars"},
            {"class": "ReplaceUpsideDown"},
            {"class": "SimulateTypos", "typo_type": "charmix", "name": "CharTypos"},
            {
                "class": "SimulateTypos",
                "typo_type": "keyboard",
                "name": "KeyboardTypos",
            },
            {
                "class": "SimulateTypos",
                "typo_type": "misspelling",
                "name": "MisspellingTypos",
            },
            {"class": "SplitWords"},
        ]

    def get_entity_set(self, text: str) -> Optional[List[str]]:
        if self.skip_ents:
            doc = self.ner(text)
            return [ent.text for ent in doc.ents]
        else:
            return None

    def perturb(self, example: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        perturbed = []
        for perturbation in self.perturbations:
            pt_example = self.apply_augmentation(perturbation, example)

            if pt_example:
                perturbed.append(pt_example)

        return perturbed

    def apply_augmentation(
        self, perturbation: Dict[str, Any], example: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        perturbation = perturbation.copy()
        class_name = perturbation.pop("class")
        name = perturbation.pop("name", None) or class_name
        aug_kwargs = perturbation

        if self.perturb_prefix == "fairness":
            kwargs["ignore_words"] = self.get_entity_set(text)

        transform = getattr(textaugs, class_name)(**aug_kwargs)

        perturb_example = example.copy()
        perturb_example["input_id"] = example["uid"]
        perturb_example["uid"] = str(example["uid"]) + "_" + name

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
    ) -> None:
        text = src_example[key]
        text = preprocess(text)

        aug_text = transform(text)

        if isinstance(aug_text, List):
            assert len(aug_text) == 1
            aug_text = aug_text[0]

        aug_example[key] = postprocess(aug_text)
