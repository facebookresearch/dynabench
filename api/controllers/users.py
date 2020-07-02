import bottle

import common.auth as _auth
import common.helpers as util

from models.user import UserModel
from models.model import ModelModel

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

@bottle.get('/users/<uid:int>/models')
def get_user_models(uid):
    """
    Fetch all user models based on user id
    :param uid:
    :return: Json Object
    """
    # check the current user and request user id are same
    is_current_user = util.is_current_user(uid=uid)
    logging.info('Current user validation status (%s) for %s' %(is_current_user, uid))
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        model = ModelModel()
        results = model.getUserModelsByUid(uid=uid, is_current_user=is_current_user, n=limit, offset=offset)
        dicts = [model_obj.to_dict() for model_obj in results]
        if dicts:
            return json.dumps(dicts)
        return []
    except Exception as e:
        logging.exception('Could not fetch user model(s) : %s' % (e))
        bottle.abort(400, 'Could not fetch user model(s)')

@bottle.get('/users/<uid:int>/models/<model_id:int>')
def get_user_models(uid, model_id):
    """
    Get users specific model detail
    :param uid: User Id
    :param model_id: Model Id
    :return: Json Object
    """
    # check the current user and request user id are same
    is_current_user = util.is_current_user(uid= uid)
    logging.info('Current user validation status (%s) for %s' %(is_current_user, uid))
    try:
        model = ModelModel()
        model_obj = model.getUserModelsByUidAndMid(uid=uid, mid=model_id, is_current_user=is_current_user)
        dicts = model_obj.to_dict()
        if dicts:
            return json.dumps(dicts)
    except Exception as e:
        logging.exception('Could not fetch user model: %s' % (e))
        bottle.abort(400, 'Could not fetch user model')

    bottle.abort(204, 'No models found')

@bottle.put('/users/<id:int>/profileUpdate')
@_auth.requires_auth
def update_user_profile(credentials, id):
    """
    Update user profile details like  real name, affiliation  and user name
    :param credentials: Authentication detail
    :param id: User id
    :return: Json Object
    """
    data = bottle.request.json
    user = UserModel()
    if not util.check_fields(data, ['username', 'affiliation', 'realname']):
        bottle.abort(400, 'Missing data')

    # validate user detail
    if not util.is_current_user(uid=id, credentials=credentials):
        bottle.abort(403, 'Not authorized to update profile')
    try:
        u = user.get(id)
        user.update(u.id, {'username': data['username'], 'affiliation': data['affiliation'],
                        'realname': data['realname']})
        return json.dumps(u.to_dict())
    except db.orm.exc.NoResultFound as ex:
        bottle.abort(404, 'User Not found')
    except Exception as ex:
        logging.exception('Could not update profile: %s' % (ex))
        bottle.abort(400, 'Could not update profile: %s' % (ex))
