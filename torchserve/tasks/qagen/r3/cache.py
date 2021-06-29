# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib
import json
import random
import re
import string

from unidecode import unidecode


def normalize_answer(s):
    """
    Taken from SQuAD 1.1 answer normalization
    Lower text and remove punctuation, articles and extra whitespace.
    """

    def remove_articles(text):
        regex = re.compile(r"\b(a|an|the)\b", re.UNICODE)
        return re.sub(regex, " ", text)

    def white_space_fix(text):
        return " ".join(text.split())

    def remove_punc(text):
        exclude = set(string.punctuation)
        return "".join(ch for ch in text if ch not in exclude)

    def lower(text):
        return text.lower()

    return white_space_fix(remove_articles(remove_punc(lower(s))))


class Cache:
    def __init__(self, cache_path):
        self.cache_path = cache_path
        self._load_cache()

    def _load_cache(self):
        with open(self.cache_path) as f:
            self.cache = json.load(f)

    @staticmethod
    def normalize(
        text: str,
        is_answer=True,
        remove_whitespace=True,
        remove_non_ascii=True,
        remove_punctuation=True,
    ) -> str:
        if is_answer:
            text = normalize_answer(text)
        text = text.lower().strip()
        if remove_whitespace:
            text = re.sub(r"\s+", "", text)
        if remove_non_ascii:
            text = unidecode(str(text))
        if remove_punctuation:
            text = text.translate(str.maketrans("", "", string.punctuation))
        return text

    @staticmethod
    def hash(text: str) -> str:
        """Return the sha1 hash of an input string"""
        hash_object = hashlib.sha1(str(text).encode("utf-8"))
        return hash_object.hexdigest()

    def get(
        self,
        context: str,
        answer: str,
        min_q_index=-1,
        filter_mode="",
        threshold_adversarial=0.4,
        threshold_uncertain=0.4,
    ) -> str:
        context_key = self.hash(
            self.normalize(context, is_answer=False, remove_punctuation=False)
        )
        answer_key = self.normalize(answer)
        if answer == "":
            answer_key = random.choice(self.cache.get(context_key, {}).keys())
        questions = self.cache.get(context_key, {}).get(answer_key, [])

        if filter_mode == "adversarial":
            questions = sorted(questions, key=lambda q: q["metadata_pred"]["f1_to_ans"])
            questions = [
                q
                for q in questions
                if q["metadata_pred"]["f1_to_ans"] <= threshold_adversarial
            ]
        elif filter_mode == "uncertain":
            questions = sorted(questions, key=lambda q: q["metadata_pred"]["conf"])
            questions = [
                q
                for q in questions
                if q["metadata_pred"]["conf"] <= threshold_uncertain
            ]

        for i, q in enumerate(questions):
            if i <= min_q_index:
                continue

            q["q_index"] = i
            return q

        return False
