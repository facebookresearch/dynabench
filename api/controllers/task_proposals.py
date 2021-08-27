# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import re

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.task import TaskModel, TaskProposal
from models.user import UserModel


@bottle.get("/task_proposal/user/get_identifiers")
@_auth.requires_auth
def get_user_task_proposal_itentifiers(credentials):
    proposals = TaskProposal.query.filter(TaskProposal.uid == credentials["id"])
    identifiers = []
    for proposal in proposals:
        identifiers.append(
            {"name": proposal.name, "task_code": proposal.task_code, "id": proposal.id}
        )
    return util.json_encode(identifiers)


@bottle.get("/task_proposal/all/get_identifiers")
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


@bottle.get("/task_proposal/get/<tpid:int>")
@_auth.requires_auth
def get_task_proposal(credentials, tpid):
    tp = TaskProposal.query.filter(TaskProposal.id == tpid)
    if tp.uid != credentials["id"]:
        um = UserModel()
        user = um.get(credentials["id"])
        if not user.admin:
            bottle.abort(403, "Access denied")
    return util.json_encode(tp.to_dict())


@bottle.post("/task_proposal/create")
@_auth.requires_auth
def create_task_proposal(credentials):
    data = bottle.request.json

    if not util.check_fields(
        data,
        [
            "task_code",
            "name",
            "annotation_config_json",
            "aggregation_metric",
            "model_wrong_metric",
            "instructions",
            "desc",
            "hidden",
            "submitable",
            "settings",
            "instance_type",
            "instance_count" "eval_metrics",
            "perf_metric",
            "delta_metrics",
            "create_endpoint",
            "gpu",
            "extra_torchserve_config",
        ],
    ):
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
        TaskModel.verify_model_wrong_metric(data["model_wrong_metric"])
    except Exception as ex:
        logger.exception("Invalid model wrong metric configuration: (%s)" % (ex))
        bottle.abort(400, "Invalid model wrong metric configuration")

    try:
        TaskModel.verify_annotation_config(data["annotation_config"])
    except Exception as ex:
        logger.exception("Invalid annotation config: (%s)" % (ex))
        bottle.abort(400, "Invalid annotation config")

    try:
        tp = TaskProposal(
            uid=credentials["id"],
            task_code=data["task_code"],
            name=data["name"],
            annotation_config_json=json.dumps(data["annotation_config"]),
            aggregation_metric=data["aggregation_metric"],
            model_wrong_metric=json.dumps(data["model_wrong_metric"]),
            instructions_md=data["instructions"],
            desc=data["desc"],
            hidden=data["hidden"],
            submitable=data["submitable"],
            settings_json=json.dumps(data["settings"]),
            instance_type=data["instance_type"],
            instance_count=data["instance_count"],
            eval_metrics=data["eval_metrics"],
            perf_metric=data["perf_metric"],
            delta_metrics=data["delta_metrics"],
            create_endpoint=data["create_endpoint"],
            gpu=data["gpu"],
            extra_torchserve_config=json.dumps(data["extra_torchserve_config"]),
        )

        tp.dbs.add(tp)
        tp.dbs.flush()
        tp.dbs.commit()
        logger.info("Added task proposal (%s)" % (tp.id))

    except Exception as error_message:
        logger.error("Could not create task proposal (%s)" % error_message)
        return False

    return util.json_encode({"success": "ok", "id": tp.id})
