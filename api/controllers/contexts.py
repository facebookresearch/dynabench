# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from urllib.parse import parse_qs

import bottle

import common.auth as _auth
import common.helpers as util
import ujson
from common.logging import logger
from models.context import Context, ContextModel
from models.round import RoundModel
from models.task import TaskModel

from .tasks import ensure_owner_or_admin


@bottle.get("/contexts/<tid:int>/<rid:int>")
@bottle.get("/contexts/<tid:int>/<rid:int>/min")
def getContext(tid, rid):
    query_dict = parse_qs(bottle.request.query_string)
    tags = _getTags(query_dict)
    return _getContext(tid, rid, tags=tags)


@bottle.get("/contexts/<tid:int>/<rid:int>/uniform")
@_auth.requires_auth_or_turk
def getUniformContext(credentials, tid, rid):
    query_dict = parse_qs(bottle.request.query_string)
    tags = _getTags(query_dict)
    return _getContext(tid, rid, "uniform", tags=tags)


@bottle.get("/contexts/<tid:int>/<rid:int>/least_fooled")
def getRandomMinLeastFooledContext(tid, rid):
    query_dict = parse_qs(bottle.request.query_string)
    tags = _getTags(query_dict)
    return _getContext(tid, rid, "least_fooled", tags=tags)


@bottle.get("/contexts/<tid:int>/<rid:int>/validation_failed")
def getRandomValidationFailedContext(tid, rid):
    query_dict = parse_qs(bottle.request.query_string)
    tags = _getTags(query_dict)
    return _getContext(tid, rid, "validation_failed", tags=tags)


def _getTags(query_dict):
    tags = None
    if "tags" in query_dict and len(query_dict["tags"]) > 0:
        tags = query_dict["tags"][0].split("|")
    return tags


def _getContext(tid, rid, method="min", tags=None):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)

    c = ContextModel()
    if method == "uniform":
        context = c.getRandom(round.id, n=1, tags=tags)
    elif method == "min":
        context = c.getRandomMin(round.id, n=1, tags=tags)
    elif method == "least_fooled":
        context = c.getRandomLeastFooled(round.id, n=1, tags=tags)
    elif method == "validation_failed":
        tm = TaskModel()
        task = tm.get(tid)
        context = c.getRandomValidationFailed(
            round.id, task.num_matching_validations, n=1, tags=tags
        )
    if not context:
        bottle.abort(500, f"No contexts available ({round.id})")
    context = context[0].to_dict()
    return util.json_encode(context)


@bottle.post("/contexts/upload/<tid:int>/<rid:int>")
@_auth.requires_auth
def do_upload(credentials, tid, rid):
    """
    Upload a contexts file for the current round
    and save the contexts to the contexts table
    :param credentials:
    :return: success info
    """

    ensure_owner_or_admin(tid, credentials["id"])

    upload = bottle.request.files.get("file")

    tm = TaskModel()
    task = tm.get(tid)

    try:
        parsed_upload_data = [
            ujson.loads(line)
            for line in upload.file.read().decode("utf-8").splitlines()
        ]
        for context_info in parsed_upload_data:
            if (
                "context" not in context_info
                or "tag" not in context_info
                or "metadata" not in context_info
                or not task.verify_annotation(context_info["context"])
            ):
                bottle.abort(400, "Invalid contexts file")

    except Exception as ex:
        logger.exception(ex)
        bottle.abort(400, "Invalid contexts file")

    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    r_realid = round.id
    contexts_to_add = []
    for context_info in parsed_upload_data:
        c = Context(
            r_realid=r_realid,
            context_json=ujson.dumps(context_info["context"]),
            metadata_json=ujson.dumps(context_info["metadata"]),
            tag=context_info["tag"],
        )
        contexts_to_add.append(c)

    rm.dbs.bulk_save_objects(contexts_to_add)
    rm.dbs.commit()
    return util.json_encode({"success": "ok"})
