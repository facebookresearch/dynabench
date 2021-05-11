# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import random
import os
import sys

from aiohttp import web
from fairseq.models.transformer import TransformerModel

from settings import my_round_id, my_secret, my_task_id

sys.path.append("..")
from common import generate_response_signature, get_cors_headers, launch_modelserver


device = "cpu"
# ROOT_DIR = '/checkpoint/maxbartolo/qgen/qa_gen/'
ROOT_DIR = os.path.expanduser('~/Desktop/qgen/')
model_paths = {
    "train_dcombined": os.path.join(ROOT_DIR, "train_dcombined_plus_squad_10k/")
}

model_key = 'train_dcombined'
task = 'qa'

SPECIAL_TOKENS = {
    'bos_token': '<s>',
    'eos_token': '</s>',
    'sep_token': '</s>'
}


# Load the model
model_path = model_paths[model_key]
logging.info(f"Loading model from: {model_path}")

model = TransformerModel.from_pretrained(
    model_name_or_path=model_path,
    checkpoint_file='checkpoint_best.pt',
    bpe='gpt2',
    fp16=True,
    beam=5, 
    sampling=True, 
    sampling_topp=0.75
)
model.to(device)


def to_list(tensor):
    return tensor.detach().cpu().tolist()


def convert_example_to_input(example):
    ex_input_inner = f" {SPECIAL_TOKENS['sep_token']} ".join(example)
    ex_input = f"{SPECIAL_TOKENS['bos_token']} {ex_input_inner} {SPECIAL_TOKENS['eos_token']}"
    return ex_input


def clean_special_tokens(text):
    for _, special_tok in SPECIAL_TOKENS.items():
        text = text.replace(special_tok, '')
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
        logging.info("Passage: {}".format(post_data["context"]))
        logging.info("Answer: {}".format(post_data["answer"]))
        
        example = [post_data["answer"].strip(), post_data["context"].strip()]
        ex_input = convert_example_to_input(example)
        logging.info("Example Input: {}".format(ex_input))

        output = model.translate(ex_input)
        clean_output = clean_special_tokens(output)
        logging.info("Example Output: {}".format(clean_output))

        response["question"] = clean_output

    except Exception as e:
        logging.exception(f"Error: {e}")

    logging.info("Generating signature")
    response["signed"] = generate_response_signature(
        my_task_id,
        my_round_id,
        my_secret,
        [
            str(response["question"]),
            post_data["context"],
            post_data["answer"],
        ],
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
