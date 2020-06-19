# Copyright (c) Facebook, Inc. and its affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
#

import sys
sys.path.append('..')
import os, random, json

from multiprocessing import Process
from aiohttp import web

from settings import my_task_id, my_round_id, my_secret

import logging

from common import launch_modelserver, get_cors_headers, generate_response_signature

from transformers import (
    AutoConfig,
    AutoModelForSequenceClassification,
    AutoTokenizer
)
import torch
import torch.nn.functional as F

async def get_model_preds(inputString):
    model_path = '/home/ubuntu/models/sentiment/sst2-roberta-megasentiment-r1'
    config = AutoConfig.from_pretrained(
        model_path,
        num_labels=2,
        finetuning_task='SST-2'
    )
    tokenizer = AutoTokenizer.from_pretrained(
        model_path
    )
    model = AutoModelForSequenceClassification.from_pretrained(
        model_path,
        config=config
    )
    model.eval()
    with torch.no_grad():
        # TODO: I am sure we can do better than this instead of setting max_length so high
        batch_encoding = tokenizer.batch_encode_plus(
            [(inputString, )], max_length=512, pad_to_max_length=True,
        )
        input_ids = torch.tensor(batch_encoding['input_ids'], dtype=torch.long)
        attention_mask = torch.tensor(batch_encoding['attention_mask'], dtype=torch.long)
        outputs = model(input_ids, attention_mask)
        preds = F.softmax(outputs[0], dim=1).squeeze()
    return preds.tolist()

async def handle_post_hypothesis(request):
    if request.content_length <= 0 :
        raise web.HTTPBadRequest(reason='Missing data')
    post_data = await request.json()
    response = {}
    if 'hypothesis' not in post_data or len(post_data['hypothesis']) < 1:
        raise web.HTTPBadRequest(reason='Missing data')

    try:
        logging.info("Example: {}".format(post_data['hypothesis']))
        response['prob'] = await get_model_preds(post_data['hypothesis'])
    except e:
        logging.exception('Error')

    logging.info('Generating signature')
    response['signed'] = generate_response_signature( \
            my_task_id, \
            my_round_id, \
            my_secret, \
            ['|'.join(str(x) for x in response['prob']), post_data['hypothesis']] \
            )

    cors_url = request.headers.get('origin')
    return web.json_response(response, headers=get_cors_headers(cors_url))

if __name__ == '__main__':
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Launch HTTP server
    url_secret = '71a840c1ea7ba20f4c5b20360938c2af04958cb343e5037ac089eb63c5417aa5'
    url_port = 8090
    launch_modelserver(url_secret, url_port, handle_post_hypothesis)
