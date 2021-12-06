# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import pickle
import subprocess
import sys
import time

import boto3
import uuid

from build_config import build_config
from utils.deployer import ModelDeployer
from utils.helpers import load_queue_dump, dotdict, api_model_update, api_send_email, api_download_model
from utils.logging import init_logger, logger

if __name__ == "__main__":
    init_logger("builder")
    logger.info("Start build server")
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=build_config["aws_access_key_id"],
        aws_secret_access_key=build_config["aws_secret_access_key"],
        region_name=build_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=build_config["builder_sqs_queue"])
    eval_queue = sqs.get_queue_by_name(QueueName=build_config["evaluation_sqs_queue"])
    redeployment_queue = load_queue_dump(build_config["queue_dump"], logger=logger)
    if redeployment_queue:
        for msg in redeployment_queue:  # ask for redeployment
            queue.send_message(MessageBody=json.dumps(msg))
        redeployment_queue = []

    DYNABENCH_API = build_config["DYNABENCH_API"]
    decen_eaas_secret = build_config["decen_eaas_secret"]

    while True:
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Build server received SQS message {msg}")

            if set(msg.keys()) <= {"model_id", "s3_uri", "model_info", "task_info", "endpoint_only", "decen_eaas"}:
                model_id = msg["model_id"]
                s3_uri = msg["s3_uri"]
                endpoint_only = msg.get("endpoint_only", False)

                # if "model_info" in msg.keys():
                json_model = json.loads(msg.get("model_info", None))
                json_model["task"] = dotdict(json.loads(msg.get("task_info")))
                model = dotdict(json_model)

                if (
                    model.deployment_status == "uploaded"
                    or model.deployment_status
                    == "takendownnonactive"
                ):
                    
                    if model.deployment_status == "uploaded":
                        model_id = model.id
                        model_secret = model.secret
                        model_endpoint_name = model.endpoint_name
                        model_task_code = model.task.task_code
                        model_task_bucket = model.task.s3_bucket

                        logger.info("Starting to download the model to s3 bucket")
                        model_download_filename = api_download_model(DYNABENCH_API, decen_eaas_secret, model_id, model_secret)

                        s3_filename = f"{model_endpoint_name}.tar.gz"
                        s3_path = f"torchserve/models/{model_task_code}/{s3_filename}"
                        bucket_name = model_task_bucket

                        session = boto3.Session(
                            aws_access_key_id=build_config["aws_access_key_id"],
                            aws_secret_access_key=build_config["aws_secret_access_key"],
                            region_name=build_config["aws_region"],
                        )
                        s3_client = session.client("s3")
                        response = s3_client.upload_fileobj(open(model_download_filename, "rb"), bucket_name, s3_path)
                        if response:
                            logger.info(f"Response from the mar file upload to s3 {response}")

                    # deploy model
                    logger.info(f"Start to deploy model {model_id}")
                    api_model_update(DYNABENCH_API, decen_eaas_secret, model, "processing")
                    deployer = ModelDeployer(model)
                    response = deployer.deploy(s3_uri, endpoint_only=endpoint_only)

                    # process deployment result
                    msg["name"] = model.name
                    msg["exception"] = response["ex_msg"]
                    # TODO: BE, make this code block more elegant
                    if response["status"] == "delayed":
                        redeployment_queue.append(msg)
                        pickle.dump(
                            redeployment_queue, open(build_config["queue_dump"], "wb")
                        )
                        api_model_update(DYNABENCH_API, decen_eaas_secret, model, "uploaded")   
                        subject = f"Model {model.name} deployment delayed"
                        template = "model_deployment_fail"
                    elif response["status"] == "failed":
                        api_model_update(DYNABENCH_API, decen_eaas_secret, model, "failed")
                        subject = f"Model {model.name} deployment failed"
                        template = "model_deployment_fail"
                    elif (
                        response["status"] == "deployed"
                        or response["status"] == "created"
                    ):
                        if response["status"] == "deployed":
                            api_model_update(DYNABENCH_API, decen_eaas_secret, model, "deployed")
                        else:
                            api_model_update(DYNABENCH_API, decen_eaas_secret, model, "created")
                        subject = f"Model {model.name} deployment successful"
                        template = "model_deployment_successful"
                        eval_message = {
                            "model_id": model_id,
                            "eval_server_id": model.task.eval_server_id,
                        }
                        eval_queue.send_message(MessageBody=json.dumps(eval_message))

                    # send email
                    api_send_email(DYNABENCH_API, decen_eaas_secret, model, msg, subject, template)
                elif model.deployment_status == "failed":
                    logger.info(f"Clean up failed model {model.endpoint_name}")
                    deployer = ModelDeployer(model)
                    deployer.cleanup_on_failure(s3_uri)
                    api_model_update(DYNABENCH_API, decen_eaas_secret, model, "takendown")
            queue.delete_messages(
                Entries=[
                    {"Id": str(uuid.uuid4()), "ReceiptHandle": message.receipt_handle}
                ]
            )
        time.sleep(5)
