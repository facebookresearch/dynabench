# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import time

import boto3

from eval_config import eval_config
from utils.computer import MetricsComputer
from utils.evaluator import JobScheduler
from utils.logging import init_logger


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
    scheduler = JobScheduler(eval_config)
    computer = MetricsComputer()
    while True:
        # On each iteration, submit all requested jobs
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Evaluation server received SQS message {msg}")
            scheduler.submit(msg["model_id"], msg["eval_id"])

        # Evaluate one job
        jobs = scheduler.pop_jobs_for_eval()
        computer.compute_metrics(jobs)  # TODO: what to do if a job failed?

        time.sleep(5)
