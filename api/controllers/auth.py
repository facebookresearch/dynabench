import bottle
import logging
import common.auth as _auth

from models.user import UserModel

@bottle.post('/authenticate')
def authenticate():
    data = bottle.request.json
    if not data or 'email' not in data or 'password' not in data:
        bottle.abort(400, 'Missing or bad credentials')
    try:
        u = UserModel()
        user = u.getByEmailAndPassword(data['email'], data['password'])
    except Exception as error_message:
        logging.exception("Authentication failure (%s)" % (data['email']))
        bottle.abort(403, 'Authentication failed: %s' % (error_message))

    if not user:
        logging.exception("Authentication failure (%s)" % (data['email']))
        bottle.abort(403, 'Authentication failed')

    # we logged in successfully, also update the refresh token
    token = _auth.get_token({'id': user.id, 'username': user.username})
    refresh_token = _auth.set_refresh_token()
    u.update(user.id, {'refresh_token': refresh_token})

    logging.info('Authentication successful for %s' % (user.username))
    return {'user': user.to_dict(), 'token': token}

@bottle.get('/authenticate/refresh')
def refresh_auth():
    payload = _auth.get_expired_token_payload()
    refresh_token = _auth.get_refresh_token()
    logging.info("Received refresh token request with token {} {}".format(refresh_token, payload))
    u = UserModel()
    user = u.getByRefreshToken(refresh_token)
    if not user or user.id != payload['id']:
        logging.info("User not found")
        bottle.abort(403, 'Access denied')
    token = _auth.get_token(payload)
    # also issue new refresh token
    refresh_token = _auth.set_refresh_token()
    u.update(user.id, {'refresh_token': refresh_token})
    return {'token': token}
