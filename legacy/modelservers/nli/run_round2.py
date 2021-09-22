# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import os
import sys
from multiprocessing import Process

from common import launch_modelserver
from model_server.servers import BertClient, RoBERTaServer
from run_round1 import handle_post_hypothesis


sys.path.append("..")
sys.path.append("./anli/src")


def run_roberta_server(port):
    """
    Run RoBERTa server, to be launched from forked proc
    """
    logging.info("Launching RoBERTa Server process")
    model_path = os.path.join("/home/ubuntu/models/nli/roberta_round2_1.pt")
    model_server = RoBERTaServer(model_path, port_num=port, device_num=-1)
    # model_path_dict = {
    #    'roberta_1': '/home/ubuntu/models/nli/roberta_round2_1.pt',
    #    'roberta_2': '/home/ubuntu/models/nli/roberta_round2_2.pt',
    #    'roberta_3': '/home/ubuntu/models/nli/roberta_round2_3.pt',
    #    'roberta_4': '/home/ubuntu/models/nli/roberta_round2_4.pt',
    #    'roberta_5': '/home/ubuntu/models/nli/roberta_round2_5.pt',
    #    'roberta_6': '/home/ubuntu/models/nli/roberta_round2_6.pt',
    #    'roberta_7': '/home/ubuntu/models/nli/roberta_round2_7.pt',
    # }
    # model_server = RoBERTaMultiModelServer(
    #   model_path_dict, port_num=port, device_num=-1
    # )
    logging.info("RoBERTa Server starting now:")
    model_server.start_server()
    model_server.shutdown()


if __name__ == "__main__":
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Spawn RoBERTa server
    server_proc = Process(target=run_roberta_server, args=(6669,))
    server_proc.start()

    # Set up client to talk to RoBERTa server
    bert_client = BertClient(6669)  # This actually just uses a BertClient
    logging.info("BERT Client started")

    # Launch HTTP server
    url_secret = "351cc8af26d8de82b394f8eb8ce67fd5d069c735578b8252a526806d48bf11cd"
    url_port = 8081
    launch_modelserver(url_secret, url_port, handle_post_hypothesis)

    # Closing
    bert_client.shutdown()
    server_proc.join()
