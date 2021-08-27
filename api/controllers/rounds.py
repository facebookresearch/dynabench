# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.round import Round, RoundModel
from models.task import TaskModel, TaskUserPermission
from models.user import UserModel


@bottle.post("/round/create/<tid:int>")
@_auth.requires_auth
def create_round(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(data, ["url", "desc", "longdesc"]):
        bottle.abort(400, "Missing data")

    tup = TaskUserPermission.query.filter(TaskUserPermission.tid == tid)
    if tup.uid != credentials["id"]:
        um = UserModel()
        user = um.get(credentials["id"])
        if not user.admin:
            bottle.abort(403, "Access denied")

    tm = TaskModel()
    task = tm.get(tid)
    task.cur_round += 1
    tm.dbs.flush()
    tm.dbs.commit()

    r = Round(
        tid=tid,
        rid=task.cur_round,
        secret=secrets.token_hex(),
        url=data["url"],
        desc=data["desc"],
        longdesc=data["longdesc"],
    )

    r.dbs.add(r)
    r.dbs.flush()
    r.dbs.commit()
    logger.info("Added round (%s)" % (r.id))

    return util.json_encode({"success": "ok"})


@bottle.post("/round/update/<tid:int>")
@_auth.requires_auth
def update_round(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(data, ["url", "desc", "longdesc"]):
        bottle.abort(400, "Missing data")

    tup = TaskUserPermission.query.filter(TaskUserPermission.tid == tid)
    if tup.uid != credentials["id"]:
        um = UserModel()
        user = um.get(credentials["id"])
        if not user.admin:
            bottle.abort(403, "Access denied")

    tm = TaskModel()
    task = tm.get(tid)

    rm = RoundModel()
    round = rm.get(task.cur_round)
    round.url = data.get("url", round.url)
    round.desc = data.get("desc", round.desc)
    round.longdesc = data.get("longdesc", round.longdesc)

    rm.dbs.flush()
    rm.dbs.commit()
    logger.info("Updated round (%s)" % (round.id))

    return util.json_encode({"success": "ok"})
