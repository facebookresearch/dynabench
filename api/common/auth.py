import bottle
import jwt
import time
import datetime
import secrets

class AuthorizationError(Exception):
    def __init__(self, message):
        self.message = message

def jwt_token_from_header():
    auth = bottle.request.headers.get('Authorization', None)
    print("Auth:", auth)
    if not auth:
        raise AuthorizationError({'code': 'authorization_header_missing', 'description': 'Authorization header is expected'})

    parts = auth.split()

    if parts[0].lower() != 'bearer':
        raise AuthorizationError({'code': 'invalid_header', 'description': 'Authorization header must start with Bearer'})
    elif len(parts) == 1:
        raise AuthorizationError({'code': 'invalid_header', 'description': 'Token not found'})
    elif len(parts) > 2:
        raise AuthorizationError({'code': 'invalid_header', 'description': 'Authorization header must be Bearer + \s + token'})

    return parts[1]

def get_payload(token):
    app = bottle.default_app()
    try:
        payload = jwt.decode(token, app.config['jwtsecret'], algorithms=[app.config['jwtalgo']])
    except jwt.ExpiredSignature:
        bottle.abort(401, {'code': 'token_expired', 'description': 'token is expired'})
    except jwt.DecodeError as e:
        bottle.abort(401, {'code': 'token_invalid', 'description': e.message})
    return payload

def requires_auth(f):
    def decorated(*args, **kwargs):
        try:
            token = jwt_token_from_header()
        except AuthorizationError as e:
            bottle.abort(403, 'Access denied (%s)' % e.message['description'])
        credentials = get_payload(token)
        args = list(args)
        args.insert(0, credentials)
        return f(*args, **kwargs)
    return decorated

def requires_auth_or_turk(f):
    def decorated(*args, **kwargs):
        try:
            token = jwt_token_from_header()
            credentials = get_payload(token)
        except AuthorizationError as e:
            if bottle.request.headers.get('Authorization') == 'turk':
                credentials = {'id': 'turk'}
            else:
                bottle.abort(403, 'Access denied (%s)' % e.message['description'])
        args = list(args)
        args.insert(0, credentials)
        return f(*args, **kwargs)
    return decorated

def auth_optional(f):
    def decorated(*args, **kwargs):
        try:
            token = jwt_token_from_header()
            credentials = get_payload(token)
        except AuthorizationError as e:
            # by default in the UI side setting None if user not logged in
            if bottle.request.headers.get('Authorization') == 'None':
                credentials = {'id': ''}
            else:
                bottle.abort(403, 'Access denied (%s)' % e.message['description'])
        args = list(args)
        args.insert(0, credentials)
        return f(*args, **kwargs)
    return decorated

def get_token(payload):
    app = bottle.default_app()
    payload['exp'] = datetime.datetime.utcnow() + \
        datetime.timedelta(seconds=app.config['jwtexp'])
    return jwt.encode(payload, app.config['jwtsecret'], algorithm=app.config['jwtalgo']).decode('utf-8')

def set_refresh_token():
    app = bottle.default_app()
    refresh_token = secrets.token_hex()
    cookie_expires = datetime.datetime.now() + datetime.timedelta(days=90)
    bottle.response.set_cookie("dynabench_refresh_token", refresh_token, path='/', expires=cookie_expires, secret=app.config['cookie_secret'], httponly=True) # samesite='none'
    return refresh_token

def get_refresh_token():
    app = bottle.default_app()
    refresh_token = bottle.request.get_cookie("dynabench_refresh_token", secret=app.config['cookie_secret'])
    return refresh_token

def get_expired_token_payload():
    app = bottle.default_app()
    try:
        token = jwt_token_from_header()
    except AuthorizationError as e:
        bottle.abort(400, e.message['description'])
    payload = jwt.decode(token, app.config['jwtsecret'], \
            algorithms=[app.config['jwtalgo']], verify=False, verify_signature=False, verify_exp=False)
    return payload
