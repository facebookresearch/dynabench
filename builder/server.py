import json
import subprocess
import sys
import time

import boto3
import bottle

from deploy_config import deploy_config
from models.model import DeploymentStatusEnum, ModelModel
from models.notification import NotificationModel
from utils import ModelDeployer, logger


sys.path.append("../api")  # noqa
from common.config import config  # noqa isort:skip
import common.mail_service as mail
from common.logging import init_logger

init_logger("builder")

if __name__ == "__main__":
    if "smtp_user" in config and config["smtp_user"] != "":
        mail_session = mail.get_mail_session(
            host=config["smtp_host"],
            port=config["smtp_port"],
            smtp_user=config["smtp_user"],
            smtp_secret=config["smtp_secret"],
        )
    else:
        mail_session = None
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=deploy_config["aws_access_key_id"],
        aws_secret_access_key=deploy_config["aws_secret_access_key"],
        region_name=deploy_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    while True:
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Build server received SQS message {msg}")
            if set(msg.keys()) == {"model_id"}:
                model_id = msg["model_id"]

                logger.info(f"Deploying model {model_id}")

                m = ModelModel()
                model = m.getUnpublishedModelByMid(model_id)

                if (
                    model.deployment_status == DeploymentStatusEnum.uploaded
                ):  # handles SQS duplicate message
                    name = model.name
                    s3_uri = model.s3_uri
                    deployed = False
                    m.update(
                        model_id, deployment_status=DeploymentStatusEnum.processing
                    )
                    try:
                        deployer = ModelDeployer(name, s3_uri)
                        endpoint_url = deployer.deploy()
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
                            subject = f"Model {name} deployment failed"
                            template = "model_deployment_fail"
                            m.update(
                                model_id, deployment_status=DeploymentStatusEnum.failed
                            )
                            deployer.cleanup_on_failure()
                        else:
                            subject = f"Model {name} deployment successful"
                            template = "model_deployment_successful"
                            m.update(
                                model_id,
                                deployment_status=DeploymentStatusEnum.deployed,
                                endpoint_url=endpoint_url,
                            )
                            deployer.cleanup_post_deployment()
                        # send email
                        user = m.getModelUserByMid(model_id)[1]
                        mail.send(
                            server=mail_session,
                            contacts=[user.email, "dynabench@fb.com"],
                            template_name=f"templates/{template}.txt",
                            msg_dict=msg,
                            subject=subject,
                        )
                        nm = NotificationModel()
                        nm.create(user.id, "MODEL_DEPLOYMENT_STATUS", template.upper())
            message.delete()
        time.sleep(5)
