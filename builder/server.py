import sys
import time

import boto3


sys.path.append('../api')  # noqa
from common.config import config  # noqa isort:skip

if __name__ == "__main__":
    sqs_service = boto3.client(
        "sqs",
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = boto3.resource("sqs")
    queue = sqs.get_queue_by_name(QueueName="dynabench-build")
    while True:
        for message in queue.receive_messages():
            body = message.body
            print(body)
            message.delete()
        time.sleep(1)
