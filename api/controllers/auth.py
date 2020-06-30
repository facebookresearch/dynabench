import bottle
import logging
import common.auth as _auth
import common.mail_service as mail

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

@bottle.post('/recover/initiate')
def recover_password():
    data = bottle.request.json
    if not data or 'email' not in data :
        bottle.abort(400, 'Missing email')

    u = UserModel()
    user = u.getByEmail(email=data['email'])
    if not user:
        return bottle.HTTPResponse(status=200, body='If you have an account, we will have sent you an email')
    try:
        # issue new forgot password token
        forgot_password_token = _auth.get_forgot_token({})
        u.update(user.id, {'forgot_password_token': forgot_password_token})

        #  send email
        subject = 'Password reset link requested'
        msg = { 'ui_server_host': bottle.default_app().config['ui_server_host'], 'token':  forgot_password_token }
        is_mail_send = mail.send(server=bottle.default_app().config['mail'],   contacts=[user.email],
                  template_name= bottle.default_app().config['forgot_pass_template'], msg_dict=msg, subject=subject)
        if not is_mail_send:
            return bottle.abort(403, 'Reset password failed')
        return {'status': 'success'}
    except Exception as error_message:
        logging.exception("Reset password failure (%s)" % (data['email']))
        bottle.abort(403, 'Reset password failed : %s' % (error_message))
