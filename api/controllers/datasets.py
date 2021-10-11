# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import re
import sys
import tempfile

import boto3
import bottle

import common.auth as _auth
import common.helpers as util
from common.config import config
from common.logging import logger
from models.dataset import AccessTypeEnum, DatasetModel
from models.task import AnnotationVerifierMode, TaskModel

from .tasks import ensure_owner_or_admin


sys.path.append("../evaluation")  # noqa isort:skip
from utils.helpers import get_data_s3_path, send_eval_request  # noqa isort:skip


@bottle.get("/datasets/get_access_types")
def get_access_types():
    return util.json_encode([enum.name for enum in AccessTypeEnum])


@bottle.put("/datasets/update/<did:int>")
@_auth.requires_auth
def update(credentials, did):
    dm = DatasetModel()
    dataset = dm.get(did)
    ensure_owner_or_admin(dataset.tid, credentials["id"])

    data = bottle.request.json
    for field in data:
        if field not in ("longdesc", "rid", "source_url", "access_type"):
            bottle.abort(
                403, """Can only modify longdesc, round, source_url, access_type"""
            )

    dm.update(did, data)
    return util.json_encode({"success": "ok"})


@bottle.delete("/datasets/delete/<did:int>")
@_auth.requires_auth
def delete(credentials, did):
    dm = DatasetModel()
    dataset = dm.get(did)
    ensure_owner_or_admin(dataset.tid, credentials["id"])

    tm = TaskModel()
    task = tm.get(dataset.tid)

    delta_metric_types = [
        config["type"]
        for config in json.loads(task.annotation_config_json)["delta_metrics"]
    ]
    delta_metric_types.append(None)

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=config["eval_aws_access_key_id"],
        aws_secret_access_key=config["eval_aws_secret_access_key"],
        region_name=config["eval_aws_region"],
    )

    for perturb_prefix in delta_metric_types:
        s3_client.delete_object(
            Bucket=task.s3_bucket,
            Key=get_data_s3_path(
                task.task_code, dataset.name + ".jsonl", perturb_prefix
            ),
        )

    dm.delete(dataset)
    return util.json_encode({"success": "ok"})


@bottle.post("/datasets/create/<tid:int>/<name>")
@_auth.requires_auth
def create(credentials, tid, name):
    ensure_owner_or_admin(tid, credentials["id"])

    if len(name) > 27 or not bool(re.search("^[a-zA-Z0-9_-]*$", name)):
        bottle.abort(
            400,
            "Invalid name (no special characters allowed besides underscores "
            + "and dashes, must be shorter than 28 characters)",
        )

    dataset_upload = bottle.request.files.get("file")

    tm = TaskModel()
    task = tm.get(tid)

    delta_dataset_uploads = []
    delta_metric_types = [
        config["type"]
        for config in json.loads(task.annotation_config_json)["delta_metrics"]
    ]
    for delta_metric_type in delta_metric_types:
        delta_dataset_uploads.append(
            (bottle.request.files.get(delta_metric_type), delta_metric_type)
        )

    uploads = [(dataset_upload, None)] + delta_dataset_uploads

    parsed_uploads = []
    # Ensure correct format
    for upload, perturb_prefix in uploads:
        try:
            parsed_upload = [
                json.loads(line)
                for line in upload.file.read().decode("utf-8").splitlines()
            ]
            for io in parsed_upload:
                if (
                    not task.verify_annotation(
                        io, mode=AnnotationVerifierMode.dataset_upload
                    )
                    or "uid" not in io
                ):
                    bottle.abort(400, "Invalid dataset file")
            parsed_uploads.append((parsed_upload, perturb_prefix))

        except Exception as ex:
            logger.exception(ex)
            bottle.abort(400, "Invalid dataset file")

    # Upload to s3
    for parsed_upload, perturb_prefix in parsed_uploads:
        try:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=config["eval_aws_access_key_id"],
                aws_secret_access_key=config["eval_aws_secret_access_key"],
                region_name=config["eval_aws_region"],
            )
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for datum in parsed_upload:
                    tmp.write(json.dumps(datum) + "\n")
                tmp.close()
                response = s3_client.upload_file(
                    tmp.name,
                    "dynabench-dev",
                    get_data_s3_path(task.task_code, name + ".jsonl", perturb_prefix),
                )
                os.remove(tmp.name)
                if response:
                    logger.info(response)
        except Exception as ex:
            logger.exception(f"Failed to load {name} to S3 due to {ex}.")

    # Create an entry in the db for the dataset, or skip if one already exists.
    d = DatasetModel()
    updated_existing_dataset = False
    if not d.getByName(name):  # avoid id increment for unsuccessful creation
        if d.create(
            name=name,
            task_id=tid,
            rid=0,
            access_type=AccessTypeEnum.hidden,
            longdesc=None,
            source_url=None,
        ):
            logger.info(f"Registered {name} in datasets db.")
    else:
        updated_existing_dataset = True

    # Evaluate all models
    eval_config = {
        "aws_access_key_id": config["eval_aws_access_key_id"],
        "aws_secret_access_key": config["eval_aws_secret_access_key"],
        "aws_region": config["eval_aws_region"],
        "evaluation_sqs_queue": config["evaluation_sqs_queue"],
    }
    send_eval_request(
        model_id="*",
        dataset_name=name,
        config=eval_config,
        eval_server_id=task.eval_server_id,
        logger=logger,
        reload_datasets=True,
    )

    return util.json_encode(
        {"success": "ok", "updated_existing_dataset": updated_existing_dataset}
    )
