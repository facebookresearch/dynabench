import json
import pickle
import subprocess
import sys
import time

import boto3
import botocore
import uuid

from deploy_config import deploy_config
from utils.deployer import ModelDeployer
from utils.helpers import load_queue_dump, get_endpoint_name
from utils.logging import init_logger, logger


sys.path.append("../api")  # noqa
import common.mail_service as mail  # isort:skip
from common.config import config  # noqa isort:skip
from models.model import DeploymentStatusEnum, ModelModel  # isort:skip
from models.notification import NotificationModel  # isort:skip

if __name__ == "__main__":
    init_logger("builder")
    logger.info("Start build server")
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=deploy_config["aws_access_key_id"],
        aws_secret_access_key=deploy_config["aws_secret_access_key"],
        region_name=deploy_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    eval_queue = sqs.get_queue_by_name(QueueName=config["evaluation_sqs_queue"])
    redeployment_queue = load_queue_dump(deploy_config["queue_dump"], logger=logger)
    if redeployment_queue:
        for msg in redeployment_queue:  # ask for redeployment
            queue.send_message(MessageBody=json.dumps(msg))
        redeployment_queue = []
    while True:
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Build server received SQS message {msg}")
            if set(msg.keys()) == {"model_id", "s3_uri"}:
                model_id = msg["model_id"]
                s3_uri = msg["s3_uri"]

                m = ModelModel()
                model = m.getUnpublishedModelByMid(model_id)

                if (
                    model.deployment_status == DeploymentStatusEnum.uploaded
                ): 
                    logger.info(f"Start to deploy model {model_id}")
                    name = model.name
                    endpoint_name = get_endpoint_name(model)
                    msg["name"] = name
                    deployed = False
                    delayed = False
                    m.update(
                        model_id, deployment_status=DeploymentStatusEnum.processing
                    )
                    try:
                        deployer = ModelDeployer(name, endpoint_name)
                        endpoint_url = deployer.deploy(model.secret, s3_uri)
                    except botocore.exceptions.ResourceLimitExceeded as ex:
                        delayed = True
                        redeployment_queue.append(msg)
                        pickle.dump(
                            redeployment_queue, open(deploy_config["queue_dump"], "wb")
                        )
                        logger.exception(
                            f"Model deployment for {name} delayed due to AWS resource limit exceeded {ex}"
                        )
                        msg[
                            "exception"
                        ] = f"Model deployment for {name} is delayed. You will get an email when it is successfully deployed."
                    except RuntimeError as e:  # handles all user exceptions
                        msg["exception"] = e
                    except Exception as e:
                        logger.exception(
                            f"Unexpected error: {sys.exc_info()[0]} with message {e}"
                        )
                        msg["exception"] = "Unexpected error"
                    else:
                        deployed = True
                    finally:
                        if not deployed:
                            template = "model_deployment_fail"
                            if delayed:
                                subject = f"Model {name} deployment delayed"
                                m.update(
                                    model_id,
                                    deployment_status=DeploymentStatusEnum.uploaded,
                                )
                            else:
                                subject = f"Model {name} deployment failed"
                                m.update(
                                    model_id,
                                    deployment_status=DeploymentStatusEnum.failed,
                                )
                            deployer.cleanup_on_failure(s3_uri)
                        else:
                            subject = f"Model {name} deployment successful"
                            template = "model_deployment_successful"
                            m.update(
                                model_id,
                                deployment_status=DeploymentStatusEnum.deployed,
                            )
                            deployer.cleanup_post_deployment()
                        # send email
                        user = m.getModelUserByMid(model_id)[1]

                        if "smtp_user" in config and config["smtp_user"] != "":
                            mail_session = mail.get_mail_session(
                                host=config["smtp_host"],
                                port=config["smtp_port"],
                                smtp_user=config["smtp_user"],
                                smtp_secret=config["smtp_secret"],
                            )
                        else:
                            mail_session = None
                        if mail_session:
                            mail.send(
                                server=mail_session,
                                config=config,
                                contacts=[user.email, "dynabench@fb.com"],
                                template_name=f"templates/{template}.txt",
                                msg_dict=msg,
                                subject=subject,
                            )
                            nm = NotificationModel()
                            nm.create(
                                user.id, "MODEL_DEPLOYMENT_STATUS", template.upper()
                            )

                    if deployed:
                        eval_queue.send_message(
                            MessageBody=json.dumps({"model_id": model_id})
                        )
                elif (
                    model.deployment_status == DeploymentStatusEnum.failed
                ): 
                    deployer = ModelDeployer(name, endpoint_name)
                    deployer.cleanup_on_failure(s3_uri)


            queue.delete_messages(
                Entries=[
                    {"Id": str(uuid.uuid4()), "ReceiptHandle": message.receipt_handle}
                ]
            )
        time.sleep(5)
