# Copyright (c) Facebook, Inc. and its affiliates.

import bottle
import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.user import UserModel


@bottle.post("/authenticate")
def authenticate():
    data = bottle.request.json
    if not data or "email" not in data or "password" not in data:
        bottle.abort(400, "Missing or bad credentials")
    try:
        u = UserModel()
        user = u.getByEmailAndPassword(data["email"], data["password"])
    except Exception as error_message:
        logger.exception("Authentication failure (%s)" % (data["email"]))
        bottle.abort(403, "Authentication failed: %s" % (error_message))

    if not user:
        logger.exception("Authentication failure (%s)" % (data["email"]))
        bottle.abort(403, "Authentication failed")

    # we logged in successfully, also update the refresh token
    token = _auth.get_token({"id": user.id, "username": user.username})
    refresh_token = _auth.set_refresh_token()
    u.update(user.id, {"refresh_token": refresh_token})

    logger.info("Authentication successful for %s" % (user.username))
    return util.json_encode({"user": user.to_dict(), "token": token})


@bottle.get("/authenticate/refresh")
def refresh_auth():
    payload = _auth.get_expired_token_payload()
    refresh_token = _auth.get_refresh_token()
    logger.info(f"Received refresh token request with token {refresh_token} {payload}")
    u = UserModel()
    user = u.getByRefreshToken(refresh_token)
    if not user or user.id != payload["id"]:
        logger.info("User not found")
        bottle.abort(403, "Access denied")
    token = _auth.get_token(payload)
    # also issue new refresh token
    refresh_token = _auth.set_refresh_token()
    u.update(user.id, {"refresh_token": refresh_token})
    return util.json_encode({"token": token})
