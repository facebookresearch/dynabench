# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib
import json
import logging
import os
import random
import re
import string
import sys
import time

from aiohttp import web
from fairseq.models.transformer import TransformerModel
from unidecode import unidecode


sys.path.append("..")  # noqa  # isort:skip
from common import (  # noqa  # isort:skip
    generate_response_signature,
    get_cors_headers,
    launch_modelserver,
)
from settings import my_round_id, my_secret, my_task_id  # noqa  # isort:skip


# Disable for deployment
logging.basicConfig(level=logging.DEBUG)


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
        is_adversarial: bool = False,
        is_uncertain: bool = False,
        min_q_index=-1,
    ) -> str:
        context_key = self.hash(
            self.normalize(context, is_answer=False, remove_punctuation=False)
        )
        answer_key = self.normalize(answer)
        questions = self.cache.get(context_key, {}).get(answer_key, [])
        logging.info(
            f"Getting from cache with answer ({answer}), min_q_index ({min_q_index}) \
            of type {type(min_q_index)}"
        )
        logging.info(f"Available questions are: {questions}")
        for i, q in enumerate(questions):
            if i <= min_q_index:
                continue

            if is_adversarial and not q["is_adversarial"]:
                continue

            if is_uncertain and not q["is_uncertain"]:
                continue

            q["q_index"] = i
            return q

        return False


device = "cpu"
# ROOT_DIR = '/checkpoint/maxbartolo/qgen/qa_gen/'
ROOT_DIR = os.path.expanduser("~/Desktop/qgen/")
model_paths = {
    "train_dcombined": os.path.join(ROOT_DIR, "train_dcombined_plus_squad_10k/")
}
cache_paths = {
    "train_dcombined": os.path.join(
        ROOT_DIR, "train_dcombined_plus_squad_10k/cache.json"
    )
}

model_key = "train_dcombined"
task = "qa"

SPECIAL_TOKENS = {"bos_token": "<s>", "eos_token": "</s>", "sep_token": "</s>"}


# Load the model
model_path = model_paths[model_key]
cache_path = cache_paths[model_key]
logging.info(f"Loading model from: {model_path}")

model = TransformerModel.from_pretrained(
    model_name_or_path=model_path,
    checkpoint_file="checkpoint_best.pt",
    bpe="gpt2",
    fp16=True,
    beam=5,
    sampling=True,
    sampling_topp=0.75,
)
model.to(device)

cache = Cache(cache_path)


def to_list(tensor):
    return tensor.detach().cpu().tolist()


def convert_example_to_input(example):
    ex_input_inner = f" {SPECIAL_TOKENS['sep_token']} ".join(example)
    ex_input = (
        f"{SPECIAL_TOKENS['bos_token']} {ex_input_inner} {SPECIAL_TOKENS['eos_token']}"
    )
    return ex_input


def clean_special_tokens(text):
    for _, special_tok in SPECIAL_TOKENS.items():
        text = text.replace(special_tok, "")
    return text.strip()


async def handle_submit_post(request):
    if request.content_length <= 0:
        raise web.HTTPBadRequest(reason="Missing data")

    post_data = await request.json()
    response = {}
    required_fields = ["context", "answer"]
    if any(
        field not in post_data or len(post_data[field]) <= 0
        for field in required_fields
    ):
        raise web.HTTPBadRequest(reason="Missing data")

    try:
        context = post_data["context"].strip()
        answer = post_data["answer"].strip()
        min_q_index = int(post_data.get("hypothesis", -1))
        logging.info(f"post_data: {post_data}")

        # logging.info("Passage: {}".format(context))
        logging.info(f"Answer: {answer}")
        logging.info(f"min_q_index: {min_q_index}")

        # Check if we have example in cache
        cache_result = cache.get(
            context=context, answer=answer, min_q_index=min_q_index
        )
        logging.info(f"Cache result: {cache_result}")
        if cache_result:
            response["question"] = cache_result["question"]
            response["question_cache_id"] = cache_result["q_index"]
            response["question_type"] = "cache"
            # Introduce a random delay
            time.sleep(0.2 + random.random())

        else:
            # Prepare the example for querying the model
            example = [answer, context]
            ex_input = convert_example_to_input(example)
            logging.info(f"Example Input: {ex_input}")

            output = model.translate(ex_input)
            clean_output = clean_special_tokens(output)
            logging.info(f"Example Output: {clean_output}")

            response["question"] = clean_output
            response["question_cache_id"] = -1
            response["question_type"] = "generated"

    except Exception as e:
        logging.exception(f"Error: {e}")

    logging.info("Generating signature")
    response["signed"] = generate_response_signature(
        my_task_id,
        my_round_id,
        my_secret,
        [str(response["question"]), post_data["context"], post_data["answer"]],
    )

    cors_url = request.headers.get("origin")
    return web.json_response(response, headers=get_cors_headers(cors_url))


if __name__ == "__main__":
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Launch HTTP server
    url_secret = "cce63f4d8238fc8061a2e3a268afe1c14c0e2135580bc1680aec62dc20f68e81"

    url_port = 8097
    launch_modelserver(url_secret, url_port, handle_submit_post)
