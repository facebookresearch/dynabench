# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import multiprocessing
import sys
import time

import boto3
import requests
import uuid
from datasets.common import BaseDataset

import common.helpers as util
from eval_config import eval_config
from utils.helpers import load_models_ids_for_task_owners
from utils.logging import init_logger
from utils.requester_decen import Requester


sys.path.append("../api")  # noqa

# TODO: [BE] strong typing on all interfce methods
sleep_interval = 5
scheduler_update_interval = 300
logger = logging.getLogger("evaluation")

DYNABENCH_API = eval_config["DYNABENCH_API"]
decen_eaas_secret = eval_config["decen_eaas_secret"]


def load_datasets_for_task_owner():
    task_code = eval_config["task_code"]
    data = {"task_code": task_code}

    r = requests.get(
        f"{DYNABENCH_API}/tasks/decen_eaas/listdatasets",
        data=json.dumps(util.wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=False,
    )

    jsonResponse = r.json()

    datasets_dict = {}

    for dataset_json in jsonResponse:
        dataset = util.json_decode(dataset_json)
        rid, _ = dataset.pop("rid"), dataset.pop("tid")
        del dataset["id"], dataset["desc"]
        if dataset["name"] not in datasets_dict:
            datasets_dict[dataset["name"]] = BaseDataset(
                round_id=rid, task_code=task_code, **dataset
            )

    return datasets_dict


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
    dataset_dict = load_datasets_for_task_owner()
    active_model_ids = load_models_ids_for_task_owners()

    while not dataset_dict:
        logger.info("Haven't got dataset_dict. Sleep.")
        time.sleep(sleep_interval)
    requester = Requester(eval_config, dataset_dict, active_model_ids)

    cpus = eval_config.get("compute_metric_processes", 2)
    with multiprocessing.pool.Pool(cpus) as pool:
        timer = scheduler_update_interval
        while True:
            # On each iteration, submit all requested jobs
            for message in queue.receive_messages():
                msg = json.loads(message.body)
                if msg.get("eval_server_id", "default") != server_id:
                    logger.info(f"Evaluation server {server_id} ignored message {msg}")
                    continue

                logger.info(f"Evaluation server {server_id} received SQS message {msg}")

                # load the necessary dictionary dict
                if msg.get("reload_datasets", False):
                    dataset_dict = load_datasets_for_task_owner()
                    while not dataset_dict:
                        logger.info("Haven't got dataset_dict. Sleep.")
                        time.sleep(sleep_interval)
                    requester = Requester(eval_config, dataset_dict, active_model_ids)

                # load the necessary active model ids dict
                if msg.get("reload_models", False):
                    active_model_ids = load_models_ids_for_task_owners()
                    requester = Requester(eval_config, dataset_dict, active_model_ids)

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
            try:
                # Evaluate one job
                job = requester.computer.find_next_ready_job()
                if job:
                    requester.computer.compute_one_async(pool, job)
            except Exception as e:
                print(e)

            time.sleep(sleep_interval)
            timer += sleep_interval


if __name__ == "__main__":
    main()
