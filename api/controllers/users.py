# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle
import sqlalchemy as db
from datetime import datetime, timedelta
import uuid
import os

import common.auth as _auth
import common.helpers as util
import common.mail_service as mail
from common.logging import logger

from models.user import UserModel
from models.model import ModelModel
from models.badge import BadgeModel
from models.notification import NotificationModel

import json

@bottle.get('/users')
#@_auth.requires_auth
#def users(credentials):
def users():
    u = UserModel()
    users = u.list()
    return util.json_encode(users)

@bottle.get('/users/<id:int>')
@_auth.requires_auth
def get_user(credentials, id):
    um = UserModel()
    user = um.get(id)
    if not user:
        bottle.abort(404, 'Not found')

    if id != credentials['id']:
        # only copy some sub fields if this is not us
        nu, u = {}, user.to_dict()
        for f in ['id', 'username', 'affiliation']:
            nu[f] = u[f]
        return util.json_encode(nu)
    else:
        return util.json_encode(user.to_dict())

@bottle.get('/users/<id:int>/badges')
@_auth.requires_auth
def get_user_with_badges(credentials, id):
    um = UserModel()
    user = um.get(id)
    if not user:
        bottle.abort(404, 'Not found')

    if id != credentials['id']:
        # only copy some sub fields if this is not us
        nu, u = {}, user.to_dict()
        for f in ['id', 'username', 'affiliation']:
            nu[f] = u[f]

        bm = BadgeModel()
        badges = bm.getByUid(id)
        if badges:
            nu['badges'] = [b.to_dict() for b in badges]

        return util.json_encode(nu)
    else:
        user = user.to_dict()
        bm = BadgeModel()
        badges = bm.getByUid(id)
        if badges:
            user['badges'] = [b.to_dict() for b in badges]

        return util.json_encode(user)


@bottle.post('/users')
def create_user():
    u = UserModel()
    bm = BadgeModel()
    nm = NotificationModel()
    data = bottle.request.json
    if not data or 'email' not in data or 'password' not in data or 'username' not in data:
        logger.info('Missing data')
        bottle.abort(400, 'Missing data')
    if u.exists(email=data['email']):
        logger.info('Email already exists')
        bottle.abort(409, 'Email already exists')
    elif u.exists(username=data['username']):
        logger.info('Username already exists')
        bottle.abort(409, 'Username already exists')

    try:
        u.create(email=data['email'], password=data['password'], username=data['username'])
        user = u.getByEmail(data['email'])
        user_dict = user.to_dict()
        refresh_token = _auth.set_refresh_token()
        u.update(user.id, {'refresh_token': refresh_token})
        bm.addBadge({'uid': user_dict['id'], 'name': 'WELCOME_NOOB'})
        nm.create(user_dict['id'], 'NEW_BADGE_EARNED', 'WELCOME_NOOB')

    except Exception as error_message:
        logger.info('Could not create user: %s' % (error_message))
        bottle.abort(400, 'Could not create user')

    token = _auth.get_token({'id': user_dict['id'], 'username': user_dict['username']})
    logger.info('Registration and authentication successful for %s' % (user_dict['username']))
    return {'user': user_dict, 'token': token}

@bottle.post('/recover/resolve/<forgot_token>')
def reset_password(forgot_token):
    """
    Validate forgot password token and update new password in user
    In token validation we used the forgot password token expiry date and time column
    :param forgot_token:
    :return: Success or Error
    """

    data = bottle.request.json
    if not data or 'password' not in data or 'email' not in data:
        logger.info('Missing data')
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
        u.update(user.id, { \
            'forgot_password_token': None, \
            'forgot_password_token_expiry_date': None, \
            'password': user.password \
            })
    except AssertionError as e:
        logger.exception('Invalid token : %s' % (e))
        bottle.abort(401, str(e))
    except Exception as error_message:
        logger.exception('Could not reset user password: %s' % (error_message))
        bottle.abort(400, 'Could not reset user password')

    logger.info('User password reset successful for %s' % (user.username))
    return {'status': 'success'}

@bottle.post('/recover/initiate')
def recover_password():
    """
    Generate forgot password token and send email to respective user
    The reset password host reads from  requested url
    :return: Success if true else raise exception
    """

    data = bottle.request.json
    if not data or 'email' not in data:
        bottle.abort(400, 'Missing email')

    u = UserModel()
    user = u.getByEmail(email=data['email'])
    if not user:
        return {'status': 'success'}
    try:
        # issuing new forgot password token
        forgot_password_token = u.generate_password_reset_token()
        expiry_datetime = datetime.now() + timedelta(hours=4)
        u.update(user.id, { \
            'forgot_password_token': forgot_password_token, \
            'forgot_password_token_expiry_date': expiry_datetime \
            })
        #  send email
        subject = 'Password Reset Request'
        msg = {'ui_server_host': util.parse_url(bottle.request.url), 'token': forgot_password_token}
        mail.send(server=bottle.default_app().config['mail'], contacts=[user.email],
                  template_name='templates/forgot_password.txt', msg_dict=msg, subject=subject)
        return {'status': 'success'}
    except Exception as error_message:
        logger.exception("Reset password failure (%s): (%s)" % (data['email'], error_message))
        bottle.abort(403, 'Reset password failed')

@bottle.get('/users/<uid:int>/models')
def get_user_models(uid):
    """
    Fetch all user models based on user id
    :param uid:
    :return: Json Object
    """
    # check the current user and request user id are same
    is_current_user = util.is_current_user(uid=uid)
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        model = ModelModel()
        results, total_count = model.getUserModelsByUid(uid=uid, is_current_user=is_current_user, n=limit, offset=offset)
        dicts = [model_obj.to_dict() for model_obj in results]
        if dicts:
            return util.json_encode({'count': total_count, 'data': dicts})
        return util.json_encode({'count': 0, 'data': []})
    except Exception as e:
        logger.exception('Could not fetch user model(s) : %s' % (e))
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
    logger.info('Current user validation status (%s) for %s' %(is_current_user, uid))
    try:
        model = ModelModel()
        model_obj = model.getUserModelsByUidAndMid(uid=uid, mid=model_id, is_current_user=is_current_user)
        dicts = model_obj.to_dict()
        if dicts:
            return util.json_encode(dicts)
    except Exception as e:
        logger.exception('Could not fetch user model: %s' % (e))
        bottle.abort(400, 'Could not fetch user model')

    bottle.abort(204, 'No models found')

@bottle.put('/users/<id:int>')
@_auth.requires_auth
def update_user_profile(credentials, id):
    """
    Update user profile details
    :param credentials: Authentication detail
    :param id: User id
    :return: Json Object
    """
    data = bottle.request.json
    u = UserModel()
    if not util.check_fields(data, ['username', 'affiliation', 'realname']):
        bottle.abort(400, 'Missing data')

    # validate user detail
    if not util.is_current_user(uid=id, credentials=credentials):
        logger.error('Not authorized to update profile')
        bottle.abort(403, 'Not authorized to update profile')

    user = u.get(id)
    if not user:
        logger.error('User does not exist (%s)' % id)
        bottle.abort(404, 'User not found')

    existing = u.getByUsername(data['username'])
    if existing and user.id != existing.id:
        logger.error('Username already exists (%s)' % data['username'])
        bottle.abort(409, 'Username already exists')

    try:
        u.update(user.id, { \
            'username': data['username'], \
            'affiliation': data['affiliation'], \
            'realname': data['realname'] \
            })
        return util.json_encode(user.to_dict())
    except Exception as ex:
        logger.exception('Could not update profile: %s' % (ex))
        bottle.abort(400, 'Could not update profile')

@bottle.post('/users/<id:int>/avatar/upload')
@_auth.requires_auth
def upload_user_profile_picture(credentials, id):
    """
    Update user profile details like  real name, affiliation  and user name
    :param credentials: Authentication detail
    :param id: User id
    :return: Json Object
    """

    u = UserModel()
    upload = bottle.request.files.get('file')
    app = bottle.default_app()
    s3_service = app.config['s3_service']
    file_name, ext = os.path.splitext(upload.filename)

    # validating file extension
    if ext not in ('.png', '.jpg', '.jpeg'):
        bottle.abort(400, 'File extension not allowed.')
    # validate user detail
    if not util.is_current_user(uid=id, credentials=credentials):
        bottle.abort(403, 'Not authorized to update profile')

    user = u.get(id)
    if not user:
        bottle.abort(403, 'Not authorized to update profile picture')

    try:
        # validate and read the file
        img_byte_str = util.read_file_content(upload.file, app.config['profile_img_max_size'])

        # upload new avatar picture with new uuid into s3 bucket
        file_name = str(uuid.uuid4()) + ext
        response = s3_service.put_object(Body=img_byte_str, Bucket=app.config['aws_s3_bucket_name'],
                                         Key='profile/' + file_name, ACL='public-read', ContentType=upload.content_type)
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            # removing old avatar picture from s3 bucket
            pic_url = user.avatar_url
            if pic_url and pic_url != '':
                s3_service.delete_object(Bucket=app.config['aws_s3_bucket_name'], Key='profile/' + pic_url.split('/')[-1])
            # update avatar s3 ur in user object
            base_url = app.config['aws_s3_profile_base_url'] + '/profile/' + file_name
            u.update(user.id, {'avatar_url': base_url})
            return util.json_encode(user.to_dict())
        else:
            raise Exception('Avatar S3 upload failed')
    except AssertionError as ex:
        bottle.abort(413, str(ex))
    except Exception as ex:
        logger.exception('Could not upload user profile picture: %s' % (ex))
        bottle.abort(400, 'Could not upload user profile picture')
