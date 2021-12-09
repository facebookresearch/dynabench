# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from urllib.parse import parse_qs

import bottle

import common.auth as _auth
import common.helpers as util
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


@bottle.get("/contexts/<tid:int>/<rid:int>/tags")
def getAllTags(tid, rid):
    return _getAllTags(tid, rid)


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


@bottle.get("/tags/get_selected/<tid:int>/<rid:int>")
@_auth.requires_auth
def getSelectedTags(credentials, tid, rid):

    return _getSelectedTags(tid, rid)


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


def _getAllTags(tid, rid):
    c = ContextModel()

    all_tags = c.getTags(rid, tid)
    return util.json_encode(all_tags)


def _getSelectedTags(tid, rid):
    rm = RoundModel()

    selected_tags = rm.getSelectedTags(tid, rid)
    return util.json_encode(selected_tags)


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
            util.json_decode(line)
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
            context_json=util.json_encode(context_info["context"]),
            metadata_json=util.json_encode(context_info["metadata"]),
            tag=context_info["tag"],
        )
        contexts_to_add.append(c)

    rm.dbs.bulk_save_objects(contexts_to_add)
    rm.dbs.commit()
    return util.json_encode({"success": "ok"})


@bottle.post("/tags/selected/<tid:int>/<rid:int>")
@_auth.requires_auth
def update_selected_tags(credentials, tid, rid):
    ensure_owner_or_admin(tid, credentials["id"])

    data = bottle.request.json

    if not util.check_fields(data, ["selected_tags"]):
        bottle.abort(400, "Invalid data")

    selected_tags = str(data["selected_tags"])

    rm = RoundModel()

    rm.updateSelectedTags(tid, rid, selected_tags)
