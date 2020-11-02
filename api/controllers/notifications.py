# Copyright (c) Facebook, Inc. and its affiliates.

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.notification import NotificationModel


@bottle.get("/notifications")
@_auth.requires_auth
def getNotifications(credentials):
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        nm = NotificationModel()
        results, total_count = nm.getByUid(credentials["id"], n=limit, offset=offset)
        dicts = [x.to_dict() for x in results]
        if dicts:
            return util.json_encode({"count": total_count, "data": dicts})
        return util.json_encode({"count": 0, "data": []})
    except Exception as e:
        logger.exception("Could not fetch notifications: %s" % (e))
        bottle.abort(400, "Could not fetch notifications")


@bottle.put("/notifications/seen")
@_auth.requires_auth
def setAllSeen(credentials):
    nm = NotificationModel()
    try:
        nm.setAllSeen(credentials["id"])
        return util.json_encode({"success": "ok"})
    except Exception as e:
        logger.exception("Could not mark notifications seen: %s" % (e))
        bottle.abort(400, "Could not mark notifications seen")
