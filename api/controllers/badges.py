# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle

import common.auth as _auth
from models.badge import BadgeModel
from models.user import UserModel


@bottle.get("/badges/getasync")
@_auth.requires_auth
def get_async_badges(credentials):
    um = UserModel()
    user = um.get(credentials["id"])
    bm = BadgeModel()
    badge_names = bm.handleHomePage(user)
    return {"status": "success", "badges": "|".join(badge_names)}
