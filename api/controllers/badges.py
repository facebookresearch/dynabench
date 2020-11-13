# Copyright (c) Facebook, Inc. and its affiliates.

import bottle

import common.auth as _auth
from models.badge import BadgeModel
from models.notification import NotificationModel
from models.user import UserModel


@bottle.get("/badges/awardasync")
@_auth.requires_auth
def award_async_badges(credentials):
    um = UserModel()
    user = um.get(credentials["id"])
    nm = NotificationModel()
    bm = BadgeModel()
    badges = bm.handleHomePage(user)
    for badge in badges:
        bm.addBadge(badge)
        nm.create(credentials["id"], "NEW_BADGE_EARNED", badge["name"])
    return {
        "status": "success",
        "badges": "|".join([badge["name"] for badge in badges]),
    }
