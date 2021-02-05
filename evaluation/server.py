# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import time

import boto3

from datasets import load_datasets
from eval_config import eval_config
from utils.computer import MetricsComputer
from utils.evaluator import JobScheduler
from utils.logging import init_logger
from utils.requester import Requester


if __name__ == "__main__":
    init_logger("evaluation")
    logger = logging.getLogger("evaluation")
    logger.info("Start evaluation server")
    dataset_dict = load_datasets()
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=eval_config["aws_access_key_id"],
        aws_secret_access_key=eval_config["aws_secret_access_key"],
        region_name=eval_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=eval_config["evaluation_sqs_queue"])
    scheduler = JobScheduler(eval_config)
    computer = MetricsComputer(eval_config)
    requester = Requester(scheduler, computer, dataset_dict)
    while True:
        # On each iteration, submit all requested jobs
        # for message in queue.receive_messages():
        # msg = json.loads(message.body)
        if True:
            msg = {"model_id": 8}
            logger.info(f"Evaluation server received SQS message {msg}")
            requester.request(msg)

        # Evaluate one job
        requester.compute(N=1)

        time.sleep(5)
