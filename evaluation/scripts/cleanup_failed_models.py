# Copyright (c) Facebook, Inc. and its affiliates.
"""
usage python scripts/cleanup_failed_models.py
"""

import json
import pickle
import sys

import boto3

from eval_config import eval_config


sys.path.append("../api")  # noqa
from common.config import config  # noqa isort:skip
from models.model import DeploymentStatusEnum, ModelModel  # noqa isort:skip


def get_failed_endpoints(eval_config, release_failed_jobs=False):
    s = pickle.load(open(eval_config["scheduler_status_dump"]))
    endpoints, failed_jobs = {}, []
    for j in s["failed"]:
        if j.status and j.status.get("FailureReason", "").startswith("AlgorithmError"):
            endpoints[j.model_id] = j.endpoint_name
            failed_jobs.append(j.job_name)
    return endpoints, failed_jobs


def update_db(endpoints):
    mm = ModelModel()
    for mid in endpoints:
        model = mm.getUnpublishedModelByMid(mid)
        if f"ts{model.upload_timestamp}-{model.name}" == endpoints[mid]:
            mm.update(mid, deployment_status=DeploymentStatusEnum.failed)


def release_failed_jobs(eval_config, failed_jobs):
    s = pickle.load(open(eval_config["scheduler_status_dump"]))
    failed_job_names = set()
    for j in failed_jobs:
        failed_job_names.add(j.job_name)
    s["failed"] = [j for j in s["failed"] if j.job_name not in failed_job_names]
    pickle.dump(s, open(eval_config["scheduler_status_dump"], "wb"))
    print(f"Released failed jobs {failed_job_names}")


def request_cleanup(eval_config, endpoints):
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=eval_config["aws_access_key_id"],
        aws_secret_access_key=eval_config["aws_secret_access_key"],
        region_name=eval_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    for mid in endpoints:
        queue.send_message(MessageBody=json.dumps({"model_id": mid, "s3_uri": ""}))


if __name__ == "__main__":
    endpoints, failed_jobs = get_failed_endpoints(release_failed_jobs=True)
    update_db(endpoints)
    request_cleanup(eval_config, endpoints)
    # release_failed_jobs(eval_config, failed_jobs)
