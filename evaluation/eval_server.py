# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import multiprocessing
import time

import boto3
import uuid

from datasets import load_datasets
from eval_config import eval_config
from utils.evaluator import Job
from utils.logging import init_logger
from utils.requester import Requester


# TODO: [BE] strong typing on all interfce methods

sleep_interval = 5
scheduler_update_interval = 300


def main():
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
    while not dataset_dict:
        logger.info("Haven't got dataset_dict. Sleep.")
        time.sleep(sleep_interval)

    # TODO: we should read the config to know the number of CPU available
    with multiprocessing.pool.Pool() as pool:
        requester = Requester(eval_config, dataset_dict)
        timer = scheduler_update_interval
        while True:
            # On each iteration, submit all requested jobs
            for message in queue.receive_messages():
                msg = json.loads(message.body)
                logger.info(f"Evaluation server received SQS message {msg}")
                requester.request(msg)
                queue.delete_messages(
                    Entries=[
                        {
                            "Id": str(uuid.uuid4()),
                            "ReceiptHandle": message.receipt_handle,
                        }
                    ]
                )
            requester.submit()

            # Update job status on scheduler interval
            if timer >= scheduler_update_interval:
                requester.update_status()
                timer = 0
            # Evaluate one job
            requester.computer.compute_async(pool, N=1)
            time.sleep(sleep_interval)
            timer += sleep_interval


if __name__ == "__main__":
    main()
