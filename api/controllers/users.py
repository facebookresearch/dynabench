import bottle
from datetime import datetime, timedelta

import common.auth as _auth
import common.helpers as util
import common.mail_service as mail

from models.user import UserModel

import json

import logging

@bottle.get('/users')
#@_auth.requires_auth
#def users(credentials):
def users():
    u = UserModel()
    users = u.list()
    return json.dumps(users)

@bottle.get('/users/<id:int>')
@_auth.requires_auth
def get_user(credentials, id):
    u = UserModel()
    user = u.get(id)
    if not user:
        bottle.abort(404, 'Not found')

    if id != credentials['id']:
        # only copy some sub fields if this is not us
        nu, u = {}, u.to_dict()
        for f in ['id', 'username', 'affiliation']:
            nu[f] = u[f]
        return json.dump(nu)
    else:
        return json.dumps(user.to_dict())

@bottle.put('/users/<id:int>')
def update_user(id):
    return bottle.template('<b>Hello {{id}}</b>!', id=id)

@bottle.post('/users')
def create_user():
    u = UserModel()
    data = bottle.request.json
    if not data or 'email' not in data or 'password' not in data or 'username' not in data:
        logging.info('Missing data')
        bottle.abort(400, 'Missing data')
    if u.exists(email=data['email']):
        logging.info('Email already exists')
        bottle.abort(409, 'Email already exists')
    elif u.exists(username=data['username']):
        logging.info('Username already exists')
        bottle.abort(409, 'Username already exists')

    try:
        u.create(email=data['email'], password=data['password'], username=data['username'])
        user = u.getByEmail(data['email'])
        refresh_token = _auth.set_refresh_token()
        u.update(user.id, {'refresh_token': refresh_token})
    except Exception as error_message:
        logging.info('Could not create user: %s' % (error_message))
        bottle.abort(400, 'Could not create user: %s' % (error_message))

    token = _auth.get_token({'id': user.id, 'username': user.username})
    logging.info('Registration and authentication successful for %s' % (user.username))
    return {'user': user.to_dict(), 'token': token}

@bottle.post('/resetPassword/<forgot_token>')
def reset_password(forgot_token):
    """
    Validate forgot password token and update new password in user
    In token validation we used the forgot password token expiry date and time column
    :param forgot_token:
    :return: Success or Error
    """

    data = bottle.request.json
    if not data or 'password' not in data or 'email' not in data:
        logging.info('Missing data')
        bottle.abort(400, 'Missing data')
    try:
        u = UserModel()
        user = u.getByForgotPasswordToken(forgot_password_token=forgot_token)
        if not user:
            raise AssertionError('Invalid token')
        if datetime.now() > user.forgot_password_token_expiry_date:
            raise AssertionError('Invalid token')
        if user.email != data['email']:
            raise AssertionError('Invalid user')

        user.set_password(data['password'])
        logging.info("Password checksum (%s)" % (user.password))
        u.update(user.id, {'forgot_password_token': None, 'forgot_password_token_expiry_date': None,
                           'password': user.password})
    except AssertionError as e:
        logging.exception('Invalid token : %s' % (e))
        bottle.abort(401, str(e))
    except Exception as error_message:
        logging.exception('Could not reset user password: %s' % (error_message))
        bottle.abort(400, 'Could not reset user password: %s' % (error_message))

    logging.info('User password reset successful for %s' % (user.username))
    return {'status': 'successful'}

@bottle.post('/recover/initiate')
def recover_password():
    """
    Generate forgot password token and send email to respective user
    The reset password host reads from  requested url
    :return: Success if true else raise exception
    """

    data = bottle.request.json
    if not data or 'email' not in data :
        bottle.abort(400, 'Missing email')

    u = UserModel()
    user = u.getByEmail(email=data['email'])
    if not user:
        return {'status': 'success'}
    try:
        # issuing new forgot password token
        forgot_password_token = u.generate_password_reset_token()
        expiry_datetime = datetime.now() + timedelta(hours=bottle.default_app().config['jwtforgotexp'])
        u.update(user.id, {'forgot_password_token': forgot_password_token,
                           'forgot_password_token_expiry_date': expiry_datetime})
        #  send email
        subject = 'Password reset link requested'
        msg = {'ui_server_host': util.parse_url(bottle.request.url), 'token':  forgot_password_token}
        mail.send(server=bottle.default_app().config['mail'],   contacts=[user.email],
                  template_name= bottle.default_app().config['forgot_pass_template'], msg_dict=msg, subject=subject)
        return {'status': 'success'}
    except Exception as error_message:
        logging.exception("Reset password failure (%s)" % (data['email']))
        bottle.abort(403, 'Reset password failed : %s' % (error_message))
