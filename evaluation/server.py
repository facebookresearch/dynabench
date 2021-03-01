# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import time

import boto3

from datasets import load_datasets
from eval_config import eval_config
from utils.logging import init_logger
from utils.requester import Requester


sleep_interval = 5
scheduler_update_interval = 300

if __name__ == "__main__":
    init_logger("evaluation")
    logger = logging.getLogger("evaluation")
    logger.info("Start evaluation server")
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=eval_config["aws_access_key_id"],
        aws_secret_access_key=eval_config["aws_secret_access_key"],
        region_name=eval_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=eval_config["evaluation_sqs_queue"])
    dataset_dict = load_datasets()
    requester = Requester(eval_config, dataset_dict)
    timer = scheduler_update_interval
    while True:
        # On each iteration, submit all requested jobs
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Evaluation server received SQS message {msg}")
            requester.request(msg)
            message.delete()

        # Update job status on scheduler interval
        if timer >= scheduler_update_interval:
            requester.update_status()
            timer = 0
        # Evaluate one job
        requester.compute(N=1)
        time.sleep(sleep_interval)
        timer += sleep_interval
