# Copyright (c) Facebook, Inc. and its affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
#

import sys
sys.path.append('..')

import logging
from multiprocessing import Process
from aiohttp import web

from common import launch_modelserver, get_cors_headers, generate_response_signature
from settings import my_task_id, my_round_id, my_secret
from qa_utils import convert_to_squad_example, compute_predictions_logits

from transformers import (
    AutoConfig,
    AutoModelForQuestionAnswering,
    AutoTokenizer
)
from transformers.data.processors.squad import squad_convert_examples_to_features, SquadResult

import torch
from torch.utils.data import DataLoader, SequentialSampler


QA_CONFIG = {
    'max_seq_length': 512,
    'max_query_length': 64,
    'max_answer_length': 30,
    'do_lower_case': False,
    'doc_stride': 128,
    'eval_batch_size': 8,
    'n_best_size': 1,
    'n_best_per_passage_size': 1
}

model_path = '/home/ubuntu/models/qa/roberta-squad_plus_harderqs-run_6'
device = 'cpu'

config = AutoConfig.from_pretrained(model_path)

tokenizer = AutoTokenizer.from_pretrained(model_path)

model = AutoModelForQuestionAnswering.from_pretrained(
    model_path,
    config=config
)
model.to(device)


def to_list(tensor):
    return tensor.detach().cpu().tolist()


async def get_model_preds(examples: list):
    model.eval()
    with torch.no_grad():
        # Convert all to SQuAD Examples
        examples = [convert_to_squad_example(passage=ex['passage'], question=ex['question']) for ex in examples]

        # Featurise the examples
        features, dataset = squad_convert_examples_to_features(
            examples=examples,
            tokenizer=tokenizer,
            max_seq_length=QA_CONFIG['max_seq_length'],
            doc_stride=QA_CONFIG['doc_stride'],
            max_query_length=QA_CONFIG['max_query_length'],
            is_training=False,
            return_dataset="pt"
        )

        eval_sampler = SequentialSampler(dataset)
        eval_dataloader = DataLoader(dataset, sampler=eval_sampler, batch_size=QA_CONFIG['eval_batch_size'])

        all_results = []
        predictions = {}

        for batch in eval_dataloader:
            inputs = {
                "input_ids": batch[0],
                "attention_mask": batch[1],
            }
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
                QA_CONFIG['n_best_per_passage_size'],
                QA_CONFIG['max_answer_length'],
                QA_CONFIG['do_lower_case'],
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
        raise web.HTTPBadRequest(reason='Missing data')

    post_data = await request.json()
    response = {}
    required_fields = ['context', 'hypothesis']
    if any(field not in post_data or len(post_data[field]) <= 0 for field in required_fields):
        raise web.HTTPBadRequest(reason='Missing data')

    try:
        logging.info("Passage: {}".format(post_data['context']))
        logging.info("Question: {}".format(post_data['hypothesis']))
        example = {
            'passage': post_data['context'].strip(),
            'question': post_data['hypothesis'].strip()
        }
        model_preds = await get_model_preds([example])
        model_pred = model_preds[0]
        response = model_pred
        response['prob'] = response['model_conf'] # this is what the frontend expects

    except Exception as e:
        logging.exception(f'Error: {e}')

    logging.info('Generating signature')
    response['signed'] = generate_response_signature( \
            my_task_id, \
            my_round_id, \
            my_secret, \
            # TODO: Should be this:
            #[response['text'], post_data['context'], post_data['hypothesis']] \
            [post_data['context'], post_data['hypothesis']] \
            )

    cors_url = request.headers.get('origin')
    return web.json_response(response, headers=get_cors_headers(cors_url))

if __name__ == '__main__':
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Launch HTTP server
    url_secret = 'b7a65254215340ae976e3e19ae87c4eaa0d10e30f7424c72888df7086a8a6846'

    url_port = 8097
    launch_modelserver(url_secret, url_port, handle_submit_post)
