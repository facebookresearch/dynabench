# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import sys
import tempfile

import boto3
import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.dataset import AccessTypeEnum, DatasetModel
from models.task import TaskModel

from .tasks import ensure_owner_or_admin


sys.path.append("../evaluation")  # noqa isort:skip
from eval_config import eval_config  # noqa isort:skip
from utils.helpers import get_data_s3_path  # noqa isort:skip


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
        if field not in ("name", "longdesc", "rid", "source_url", "access_type"):
            bottle.abort(
                403,
                """Can only modify name, longdesc, round, source_url, access_type""",
            )

    dm.update(did, data)
    return util.json_encode({"success": "ok"})


@bottle.post("/datasets/create/<tid:int>/<name>")
@_auth.requires_auth
def create(credentials, tid, name):
    ensure_owner_or_admin(tid, credentials["id"])

    upload = bottle.request.files.get("file")

    tm = TaskModel()
    task = tm.get(tid)

    # Ensure correct format
    try:
        parsed_upload_data = [
            json.loads(line) for line in upload.file.read().decode("utf-8").splitlines()
        ]
        for io in parsed_upload_data:
            if not task.verify_annotation(io):
                bottle.abort(400, "Invalid dataset file")

    except Exception as ex:
        logger.exception(ex)
        bottle.abort(400, "Invalid dataset file")

    # Upload to s3
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=eval_config["aws_access_key_id"],
            aws_secret_access_key=eval_config["aws_secret_access_key"],
            region_name=eval_config["aws_region"],
        )
        with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
            index = 0
            for datum in parsed_upload_data:
                datum["uid"] = str(
                    index
                )  # NOTE: this means nobody can have an annotation object with the
                # name "uid"
                index += 1
                tmp.write(json.dumps(datum) + "\n")
            tmp.close()
            response = s3_client.upload_file(
                tmp.name,
                task.s3_bucket,
                get_data_s3_path(task.task_code, name + ".jsonl", None),
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
            task_id=task.id,
            rid=0,
            access_type=AccessTypeEnum.hidden,
            longdesc=None,
            source_url=None,
        ):
            logger.info(f"Registered {name} in datasets db.")
    else:
        updated_existing_dataset = True

    # TODO: re-request evaluation here?

    return util.json_encode(
        {"success": "ok", "updated_existing_dataset": updated_existing_dataset}
    )
