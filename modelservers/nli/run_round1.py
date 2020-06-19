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

from multiprocessing import Process
from aiohttp import web

from model_server.servers import BertClient, BertServer
from settings import my_task_id, my_round_id, my_secret

import logging

from common import launch_modelserver, get_cors_headers, generate_response_signature

async def handle_post_hypothesis(request):
    if request.content_length <= 0 :
        raise web.HTTPBadRequest(reason='Missing data')
    post_data = await request.json()
    if 'hypothesis' not in post_data or len(post_data['hypothesis']) < 1:
        raise web.HTTPBadRequest(reason='Missing data')

    try:
        bert_input = {
            's1': post_data['context'],
            's2': post_data['hypothesis']
        }
        logging.info("Example: {}".format(bert_input))
        response = bert_client.infer(bert_input)
    except e:
        logging.exception('Error')

    logging.info('Generating signature')
    response['signed'] = generate_response_signature( \
            my_task_id, \
            my_round_id, \
            my_secret, \
            [response['prob'], response['s1'], response['s2']] \
            )

    cors_url = request.headers.get('origin')
    return web.json_response(response, headers=get_cors_headers(cors_url))

def run_bert_server(port):
    '''
    Run BERT server, to be launched from forked proc
    '''
    logging.info("Launching BERT Server process")
    model_path = os.path.join('/home/ubuntu/models/nli/bert_round1.pt')
    model_server = BertServer(model_path, port_num=port, device_num=-1)
    logging.info("BERT Server starting now:")
    model_server.start_server()
    model_server.shutdown()

if __name__ == '__main__':
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Spawn BERT server
    server_proc = Process(target=run_bert_server, args=(6666,))
    server_proc.start()

    # Set up client to talk to BERT server
    bert_client = BertClient(6666)
    logging.info("BERT Client started")

    # Launch HTTP server
    url_secret = 'aab397c39e7e84c8dfdf1455721cea799c6d3893884dec30af79a7445fa40d7d'
    url_port = 8080
    launch_modelserver(url_secret, url_port, handle_post_hypothesis)

    # Closing
    bert_client.shutdown()
    server_proc.join()
