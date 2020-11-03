# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import sys
from multiprocessing import Process

from common import launch_modelserver
from model_server.servers import BertClient, RoBERTaMultiModelServer
from run_round1 import handle_post_hypothesis


sys.path.append("..")
sys.path.append("./anli/src")


def run_roberta_server(port):
    """
    Run RoBERTa server, to be launched from forked proc
    """
    logging.info("Launching RoBERTa Server process")
    # model_path = os.path.join('/home/ubuntu/models/nli/roberta_round3_1.pt')
    # model_server = RoBERTaServer(model_path, port_num=port, device_num=-1)
    model_path_dict = {
        "roberta_1": "/home/ubuntu/models/nli/roberta_round3_1.pt",
        "roberta_2": "/home/ubuntu/models/nli/roberta_round3_2.pt",
        "roberta_3": "/home/ubuntu/models/nli/roberta_round3_3.pt",
        "roberta_4": "/home/ubuntu/models/nli/roberta_round3_4.pt",
        "roberta_5": "/home/ubuntu/models/nli/roberta_round3_5.pt",
        "roberta_6": "/home/ubuntu/models/nli/roberta_round3_6.pt",
        "roberta_7": "/home/ubuntu/models/nli/roberta_round3_7.pt",
    }
    model_server = RoBERTaMultiModelServer(
        model_path_dict, port_num=port, device_num=-1
    )
    logging.info("RoBERTa Server starting now:")
    model_server.start_server()
    model_server.shutdown()


if __name__ == "__main__":
    # Set up logger
    logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

    # Spawn RoBERTa server
    server_proc = Process(target=run_roberta_server, args=(6670,))
    server_proc.start()

    # Set up client to talk to RoBERTa server
    bert_client = BertClient(6670)  # This actually just uses a BertClient
    logging.info("BERT Client started")

    # Launch HTTP server
    url_secret = "971e1e63052930b77af74bb2a67150ac8c98047c8896401057b07ab9d0b626a1"
    url_port = 8082
    launch_modelserver(url_secret, url_port, handle_post_hypothesis)

    # Closing
    bert_client.shutdown()
    server_proc.join()
