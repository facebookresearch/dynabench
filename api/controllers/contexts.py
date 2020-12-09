# Copyright (c) Facebook, Inc. and its affiliates.

import bottle

import common.auth as _auth
import common.helpers as util
from models.context import ContextModel
from models.round import RoundModel


@bottle.post("/contexts/<tid:int>/<rid:int>")
@bottle.post("/contexts/<tid:int>/<rid:int>/min")
def getContext(tid, rid):
    data = bottle.request.json
    tags = None
    if "tags" in data:
        tags = data["tags"]

    return _getContext(tid, rid, tags=tags)


@bottle.post("/contexts/<tid:int>/<rid:int>/uniform")
@_auth.requires_auth_or_turk
def getUniformContext(credentials, tid, rid):
    data = bottle.request.json
    tags = None
    if "tags" in data:
        tags = data["tags"]

    return _getContext(tid, rid, "uniform", tags)


def _getContext(tid, rid, method="min", tags=None):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    c = ContextModel()
    if method == "uniform":
        context = c.getRandom(round.id, n=1, tags=tags)
    elif method == "min":
        context = c.getRandomMin(round.id, n=1, tags=tags)
    if not context:
        bottle.abort(500, f"No contexts available ({round.id})")
    context = context[0].to_dict()
    return util.json_encode(context)
