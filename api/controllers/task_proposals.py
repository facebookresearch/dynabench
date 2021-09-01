# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.task import TaskModel, TaskProposal
from models.user import UserModel


@bottle.get("/task_proposals/user/get_identifiers")
@_auth.requires_auth
def get_user_task_proposal_itentifiers(credentials):
    proposals = TaskProposal.query.filter(TaskProposal.uid == credentials["id"])
    identifiers = []
    for proposal in proposals:
        identifiers.append(
            {"name": proposal.name, "task_code": proposal.task_code, "id": proposal.id}
        )
    return util.json_encode(identifiers)


@bottle.get("/task_proposals/all/get_identifiers")
@_auth.requires_auth
def get_all_task_proposal_itentifiers(credentials):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        bottle.abort(403, "Access denied")
    proposals = TaskProposal.query
    identifiers = []
    for proposal in proposals:
        identifiers.append(
            {"name": proposal.name, "task_code": proposal.task_code, "id": proposal.id}
        )
    return util.json_encode(identifiers)


@bottle.get("/task_proposals/get/<tpid:int>")
@_auth.requires_auth
def get_task_proposal(credentials, tpid):
    tp = TaskProposal.query.filter(TaskProposal.id == tpid)
    if tp.uid != credentials["id"]:
        um = UserModel()
        user = um.get(credentials["id"])
        if not user.admin:
            bottle.abort(403, "Access denied")
    return util.json_encode(tp.to_dict())


@bottle.post("/task_proposals/create")
@_auth.requires_auth
def create_task_proposal(credentials):
    data = bottle.request.json

    if not util.check_fields(data, ["task_code", "name", "desc"]):
        bottle.abort(400, "Missing data")

    tm = TaskModel()
    if tm.getByTaskCode(data["task_code"]):
        bottle.abort(400, "Invalid task code; this task code is already taken")

    if tm.getByName(data["name"]):
        bottle.abort(400, "Invalid name; this name is already taken")

    if not bool(re.search("^[a-zA-Z0-9_-]*$", data["task_code"])):
        bottle.abort(
            400,
            "Invalid task code (no special characters allowed besides underscores "
            + "and dashes):",
            data["task_code"],
        )

    try:
        tp = TaskProposal(
            uid=credentials["id"],
            task_code=data["task_code"],
            name=data["name"],
            desc=data["desc"],
        )

        tp.dbs.add(tp)
        tp.dbs.flush()
        tp.dbs.commit()
        logger.info("Added task proposal (%s)" % (tp.id))

    except Exception as error_message:
        logger.error("Could not create task proposal (%s)" % error_message)
        return False

    return util.json_encode({"success": "ok", "id": tp.id})
