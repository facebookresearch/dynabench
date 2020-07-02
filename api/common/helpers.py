import bottle

import common.auth as _auth
from models.user import UserModel

import logging

def check_fields(data, fields):
    if not data:
        return False
    for f in fields:
        if f not in data:
            return False
    return True

def is_current_user(uid, credentials=None):
    """
    Validate the user id is currently logged in one.
    :param uid: User id
    :param credentials: Authorization detail
    :return: Boolean
    """
    try:
        if not credentials:
            token = _auth.jwt_token_from_header()
            credentials = _auth.get_payload(token)
        u = UserModel()
        user = u.get(uid)
        if not user:
            return False
        if uid != credentials['id']:
            return False
        return True
    except Exception as ex:
        logging.exception('Current user  verification failed  for (%s) exception : %s ' %(uid, ex))
        return False

def get_limit_and_offset_from_request():
    """
    Extract the limit and offset value from request
    which is help to design the pagination
    :return: limit, offset
    """

    try:
        limit = bottle.request.query.get('limit')
        offset = bottle.request.query.get('offset')
        if not limit:
            limit = 5
        if not offset:
            offset = 0
        # handle if limit in string like ss
        limit = int(limit)
        offset = int(offset)
    except Exception as ex:
        logging.exception('Query param parsing issue :(%s)' %(ex))
        limit = 5
        offset = 0

    return limit, offset

