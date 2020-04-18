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

from model_server.servers import BertClient, BertServer
from settings import my_task_id, my_round_id, my_secret

import logging

import hashlib

def get_cors_headers(cors_url):
    headers = {}
    valid_cors_urls = ['http://54.187.22.210', 'http://54.187.22.210:3000', 'http://dynabench.org:3000', 'http://beta.dynabench.org']
    if cors_url not in valid_cors_urls:
        cors_url = 'http://dynabench.org'
    headers['Access-Control-Allow-Origin'] = cors_url
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    headers['Access-Control-Allow-Credentials'] = 'true'
    return headers

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
    preds = '|'.join(str(x) for x in response['prob'])
    h = hashlib.sha1()
    print("{}{}{}{}{}{}".format( \
            response['s1'].encode('utf-8'),
            response['s2'].encode('utf-8'),
            my_task_id, my_round_id, preds,
            my_secret.encode('utf-8')
        ))
    h.update(response['s1'].encode('utf-8'))
    h.update(response['s2'].encode('utf-8'))
    h.update("{}{}{}".format(my_task_id, my_round_id, preds).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logging.info('Signature {}'.format(signed))
    response['signed'] = signed

    cors_url = request.headers.get('origin')
    return web.json_response(response, headers=get_cors_headers(cors_url))#, headers={'Access-Control-Allow-Origin': '*'})

async def handle_options(request):
    cors_url = request.headers.get('origin')
    return web.Response(headers=get_cors_headers(cors_url))

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
    app = web.Application()
    app.add_routes([
        web.options('/aab397c39e7e84c8dfdf1455721cea799c6d3893884dec30af79a7445fa40d7d', handle_options),
        web.post('/aab397c39e7e84c8dfdf1455721cea799c6d3893884dec30af79a7445fa40d7d', handle_post_hypothesis),
        ])
    logging.info("Launching HTTP Server")

    #ssl_context = ssl.create_default_context(ssl.PROTOCOL_SSLv23)
    #ssl_context = ssl.SSLContext(ssl.PROTOCOL_SSLv23)

    # WITH SSL, adversarialnli.com:
    #ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    #ssl_context.load_cert_chain('/home/ubuntu/.ssl/adversarialnli.com.crt', keyfile='/home/ubuntu/.ssl/adversarialnli.com-key.pem')
    #web.run_app(app, ssl_context=ssl_context)
    # WITHOUT SSL (for now), dynabench:
    web.run_app(app)

    bert_client.shutdown()
    server_proc.join()
