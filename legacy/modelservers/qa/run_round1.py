# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import random
import sys

import torch
from aiohttp import web
from torch.utils.data import DataLoader, SequentialSampler
from transformers import AutoConfig, AutoModelForQuestionAnswering, AutoTokenizer
from transformers.data.metrics.squad_metrics import compute_exact, compute_f1
from transformers.data.processors.squad import (
    SquadResult,
    squad_convert_examples_to_features,
)

from common import generate_response_signature, get_cors_headers, launch_modelserver
from qa_utils import compute_predictions_logits, convert_to_squad_example
from settings import my_round_id, my_secret, my_task_id


sys.path.append("..")


THRESHOLD_F1 = 0.4
QA_CONFIG = {
    "max_seq_length": 512,
    "max_query_length": 64,
    "max_answer_length": 30,
    "do_lower_case": False,
    "doc_stride": 128,
    "eval_batch_size": 8,
    "n_best_size": 1,
    "n_best_per_passage_size": 1,
}

device = "cpu"
model_paths = {
    "round1_bert": "/home/ubuntu/models/qa/qa_round1_bert",
    "round1_roberta": "/home/ubuntu/models/qa/qa_round1_roberta",
}

configs, tokenizers, model_ids, models = {}, {}, {}, {}
for i, (model_id, model_path) in enumerate(model_paths.items()):
    model_ids[i] = model_id
    configs[i] = AutoConfig.from_pretrained(model_path)
    tokenizers[i] = AutoTokenizer.from_pretrained(model_path)
    models[i] = AutoModelForQuestionAnswering.from_pretrained(
        model_path, config=configs[i]
    )
    models[i].to(device)


def to_list(tensor):
    return tensor.detach().cpu().tolist()


async def get_model_preds(model, tokenizer, examples: list):
    model.eval()
    with torch.no_grad():
        # Convert all to SQuAD Examples
        examples = [
            convert_to_squad_example(passage=ex["passage"], question=ex["question"])
            for ex in examples
        ]

        # Featurise the examples
        features, dataset = squad_convert_examples_to_features(
            examples=examples,
            tokenizer=tokenizer,
            max_seq_length=QA_CONFIG["max_seq_length"],
            doc_stride=QA_CONFIG["doc_stride"],
            max_query_length=QA_CONFIG["max_query_length"],
            is_training=False,
            return_dataset="pt",
        )

        eval_sampler = SequentialSampler(dataset)
        eval_dataloader = DataLoader(
            dataset, sampler=eval_sampler, batch_size=QA_CONFIG["eval_batch_size"]
        )

        all_results = []
        predictions = {}

        for batch in eval_dataloader:
            inputs = {"input_ids": batch[0], "attention_mask": batch[1]}
            example_indices = batch[3]
            outputs = model(**inputs)

            for i, example_index in enumerate(example_indices):
                eval_feature = features[example_index.item()]
                unique_id = int(eval_feature.unique_id)

                output = [to_list(output[i]) for output in outputs]

                start_logits, end_logits = output
                result = SquadResult(unique_id, start_logits, end_logits)

                all_results.append(result)

            batch_predictions = compute_predictions_logits(
                examples,
                features,
                all_results,
                QA_CONFIG["n_best_per_passage_size"],
                QA_CONFIG["max_answer_length"],
                QA_CONFIG["do_lower_case"],
                None,
                None,
                None,
                False,
                False,
                0.0,
                tokenizer,
            )
            predictions.update(batch_predictions)

        predictions_by_examples = [predictions[ex.qas_id] for ex in examples]
        return predictions_by_examples


async def handle_submit_post(request):
    if request.content_length <= 0:
        raise web.HTTPBadRequest(reason="Missing data")

    post_data = await request.json()
    response = {}
    required_fields = ["context", "hypothesis", "answer"]
    if any(
        field not in post_data or len(post_data[field]) <= 0
        for field in required_fields
    ):
        raise web.HTTPBadRequest(reason="Missing data")

    try:
        logging.info("Passage: {}".format(post_data["context"]))
        logging.info("Question: {}".format(post_data["hypothesis"]))
        example = {
            "passage": post_data["context"].strip(),
            "question": post_data["hypothesis"].strip(),
        }

        random_model_index = random.randint(0, len(model_paths) - 1)
        model = models[random_model_index]
        tokenizer = tokenizers[random_model_index]

        model_preds = await get_model_preds(model, tokenizer, [example])
        model_pred = model_preds[0]
        response["text"] = model_pred["text"]
        response["prob"] = max(
            0.0, min(1.0, model_pred["model_conf"])
        )  # this is what the frontend expects

        # Evaluate the model prediction against the human answer
        human_ans = str(post_data["answer"]).strip()
        response["eval_f1"] = compute_f1(human_ans, response["text"])
        response["eval_exact"] = compute_exact(human_ans, response["text"])
        response["model_id"] = model_ids[random_model_index]
        response["model_is_correct"] = response["eval_f1"] > THRESHOLD_F1

    except Exception as e:
        logging.exception(f"Error: {e}")

    logging.info("Generating signature")
    response["signed"] = generate_response_signature(
        my_task_id,
        my_round_id,
        my_secret,
        [
            str(response["model_is_correct"]) + "|" + str(response["text"]),
            post_data["context"],
            post_data["hypothesis"],
        ],
    )

    cors_url = request.headers.get("origin")
    return web.json_response(response, headers=get_cors_headers(cors_url))


if __name__ == "__main__":
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Launch HTTP server
    url_secret = "b7a65254215340ae976e3e19ae87c4eaa0d10e30f7424c72888df7086a8a6846"

    url_port = 8097
    launch_modelserver(url_secret, url_port, handle_submit_post)
