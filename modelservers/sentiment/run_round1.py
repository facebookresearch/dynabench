# Copyright (c) Facebook, Inc. and its affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
#

import sys
sys.path.append('..')
sys.path.append('./anli/src')
import os, random, json
import ssl

from multiprocessing import Process
from aiohttp import web

from settings import my_task_id, my_round_id, my_secret

import logging

import hashlib

def get_cors_headers():
    headers = {}
    headers['Access-Control-Allow-Origin'] = 'http://54.187.22.210'
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    headers['Access-Control-Allow-Credentials'] = 'true'
    return headers

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
        preds = F.softmax(outputs[0], dim=1)
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
    preds = '|'.join(str(x) for x in response['prob'])
    h = hashlib.sha1()
    print("{}{}{}{}{}".format( \
            post_data['hypothesis'].encode('utf-8'),
            my_task_id, my_round_id, preds,
            my_secret.encode('utf-8')
        ))
    h.update(post_data['hypothesis'].encode('utf-8'))
    h.update("{}{}{}".format(my_task_id, my_round_id, preds).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logging.info('Signature {}'.format(signed))
    response['signed'] = signed

    return web.json_response(response, headers=get_cors_headers())#, headers={'Access-Control-Allow-Origin': '*'})

async def handle_options(request):
    return web.Response(headers=get_cors_headers())

if __name__ == '__main__':
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Launch HTTP server
    app = web.Application()
    app.add_routes([
        web.options('/71a840c1ea7ba20f4c5b20360938c2af04958cb343e5037ac089eb63c5417aa5', handle_options),
        web.post('/71a840c1ea7ba20f4c5b20360938c2af04958cb343e5037ac089eb63c5417aa5', handle_post_hypothesis),
        ])
    logging.info("Launching HTTP Server")

    #ssl_context = ssl.create_default_context(ssl.PROTOCOL_SSLv23)
    #ssl_context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)

    # WITH SSL, adversarialnli.com:
    #ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    #ssl_context.load_cert_chain('/home/ubuntu/.ssl/adversarialnli.com.crt', keyfile='/home/ubuntu/.ssl/adversarialnli.com-key.pem')
    #web.run_app(app, ssl_context=ssl_context)
    # WITHOUT SSL (for now), dynabench:
    web.run_app(app, port=8090)
