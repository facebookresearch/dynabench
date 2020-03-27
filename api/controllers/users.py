import bottle

import common.auth as _auth

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
