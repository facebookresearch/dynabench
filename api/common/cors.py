import bottle

@bottle.route('/<:re:.*>', method='OPTIONS')
def enable_cors_generic_route():
    add_cors_headers()
@bottle.hook('after_request')
def enable_cors_after_request_hook():
    add_cors_headers()
def add_cors_headers():
    bottle.response.headers['Access-Control-Allow-Origin'] = 'http://54.185.202.254:3000'
    bottle.response.headers['Access-Control-Allow-Methods'] = \
        'GET, POST, PUT, OPTIONS'
    bottle.response.headers['Access-Control-Allow-Headers'] = \
        'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    bottle.response.headers['Access-Control-Allow-Credentials'] = 'true'
@bottle.hook('after_request')
def add_safety_headers():
    bottle.response.headers['X-Frame-Options'] = 'deny'
