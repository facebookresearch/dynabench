# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import re

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.base import DBSession as dbs
from models.task import TaskModel
from models.task_proposal import TaskProposal, TaskProposalModel
from models.user import UserModel


@bottle.get("/task_proposals/user/<page:int>/<limit:int>")
@_auth.requires_auth
def get_user_task_proposals(credentials, page, limit):
    tpm = TaskProposalModel()
    proposals = tpm.getByUid(credentials["id"])
    identifiers = []
    for proposal in proposals:
        identifiers.append(proposal.to_dict())
    return util.json_encode(
        {
            "data": identifiers[page * limit : page * limit + limit],
            "count": len(identifiers),
        }
    )


@bottle.get("/task_proposals/all/<page:int>/<limit:int>")
@_auth.requires_auth
def get_all_task_proposals(credentials, page, limit):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        bottle.abort(403, "Access denied")

    proposals = dbs.query(TaskProposal)
    identifiers = []
    for proposal in proposals:
        identifiers.append(proposal.to_dict())
    return util.json_encode(
        {
            "data": identifiers[page * limit : page * limit + limit],
            "count": len(identifiers),
        }
    )


@bottle.post("/task_proposals/create")
@_auth.requires_auth
def create_task_proposal(credentials):
    data = bottle.request.json

    if not util.check_fields(data, ["task_code", "name", "desc", "longdesc"]):
        bottle.abort(400, "Missing data")

    tm = TaskModel()
    if tm.getByTaskCode(data["task_code"]):
        bottle.abort(400, "Invalid task code; this task code is already taken")

    if tm.getByName(data["name"]):
        bottle.abort(400, "Invalid name; this name is already taken")

    if not bool(
        re.search("(?=^[a-zA-Z0-9_-]*$)(?=.*[a-zA-Z].*).*$", data["task_code"])
    ):
        bottle.abort(
            400,
            "Invalid task code (no special characters allowed besides underscores "
            + "and dashes. Atleast one letter required)",
        )

    try:
        tp = TaskProposal(
            uid=credentials["id"],
            task_code=data["task_code"],
            name=data["name"],
            desc=data["desc"],
            longdesc=data["longdesc"],
        )

        tm.dbs.add(tp)
        tm.dbs.flush()
        tm.dbs.commit()
        logger.info("Added task proposal (%s)" % (tp.id))

    except Exception as error_message:
        logger.error("Could not create task proposal (%s)" % error_message)
        return False

    return util.json_encode({"success": "ok", "id": tp.id})
