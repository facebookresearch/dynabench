# Copyright (c) Facebook, Inc. and its affiliates.

import contextlib
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
logger = logging.getLogger("evaluation")


def main():
    init_logger("evaluation")
    server_id = eval_config["eval_server_id"]
    logger.info(f"Start evaluation server '{server_id}'")

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
    requester = Requester(eval_config, dataset_dict)

    cpus = eval_config.get("compute_metric_processes", 2)
    with contextlib.ExitStack() as stack:
        flores_full_pool = stack.enter_context(multiprocessing.pool.Pool(cpus))
        flores_small_pool = stack.enter_context(multiprocessing.pool.Pool(cpus))
        last_pool_status = (0, 0)
        timer = scheduler_update_interval
        while True:
            # On each iteration, submit all requested jobs
            for message in queue.receive_messages():
                msg = json.loads(message.body)
                if msg.get("eval_server_id", "default") != server_id:
                    logger.info(f"Evaluation server {server_id} ignored message {msg}")
                    continue

                logger.info(f"Evaluation server {server_id} received SQS message {msg}")
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
            job = requester.computer.find_next_ready_job()
            if job:
                if "flores101-full" in job.dataset_name:
                    requester.computer.compute_one_async(flores_full_pool, job)
                else:
                    requester.computer.compute_one_async(flores_small_pool, job)

            computing = requester.computer.get_jobs("Computing")
            n_full = len([j for j in computing if "flores101-full" in j.dataset_name])
            n_small = len(computing) - n_full
            if last_pool_status != (n_full, n_small):
                logger.info(f"flores101-full pool: {n_full} tasks for {cpus} cpus")
                logger.info(f"flores101-small pool: {n_small} tasks for {cpus} cpus")
                last_pool_status = (n_full, n_small)

            time.sleep(sleep_interval)
            timer += sleep_interval


if __name__ == "__main__":
    main()
