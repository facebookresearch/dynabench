import os, sys
sys.path.append('../../api')

import bottle
from common.cors import *

sys.path.append('./anli/src')

from model_server.servers import BertServer, BertClient

import logging

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

# First, start the model server as a background process
try:
    pid = os.fork()
except OSError:
    exit("Could not create a child process")

if pid == 0:
    model_path = "/home/ubuntu/saved_models/06-21-21:12:27_bert-large-uncased_on_smnli/yixin_bert.model"
    model_server = BertServer(model_path, port_num=6666, device_num=-1)
    model_server.start_server()
    model_server.shutdown()

# Second, handle incoming http requests and forward to the model server via client
app = bottle.default_app()
app.default_error_handler = my_error_handler
bert_client = BertClient(6666)
@bottle.post('/')
def handle():
    data = bottle.request.json
    if not data or 'context' not in data or 'hypothesis' not in data:
        logging.info('Missing data')
        bottle.abort(400, 'Missing data')
    # TODO: check secret, attach some encrypted msg
    response = bert_client.infer({'s1': data['context'], 's2': data['hypothesis']})
    return json.dumps(response)

bottle.run(host='0.0.0.0', port=8081, debug=True, reloader=True)

bert_client.shutdown()
os.waitpid(0, 0)
