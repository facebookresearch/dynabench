# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.dataset import AccessTypeEnum, DatasetModel
from models.task import TaskModel

from .tasks import ensure_owner_or_admin


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


@bottle.put("/datasets/create/<tid:int>")
@_auth.requires_auth
def create(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])

    upload = bottle.request.files.get("file")

    tm = TaskModel()
    task = tm.get(tid)

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

    # TODO: actually add the dataset to the db and s3
