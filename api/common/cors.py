import bottle
import logging
import urllib

@bottle.route('/<:re:.*>', method='OPTIONS')
def enable_cors_generic_route():
    add_cors_headers()
@bottle.hook('after_request')
def enable_cors_after_request_hook():
    add_cors_headers()
def add_cors_headers():
    parsed_origin_url = urllib.parse.urlparse(bottle.request.get_header('origin'))
    if parsed_origin_url.hostname.endswith('dynabench.org') or \
            parsed_origin_url.hostname.endswith('herokuapp.com') or \
            parsed_origin_url.hostname == 'localhost':
        origin = bottle.request.get_header('origin')
    else:
        origin = 'https://dynabench.org'

    app = bottle.default_app()
    bottle.response.headers['Access-Control-Allow-Origin'] = origin
    bottle.response.headers['Access-Control-Allow-Methods'] = \
        'GET, POST, PUT, OPTIONS'
    bottle.response.headers['Access-Control-Allow-Headers'] = \
        'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    bottle.response.headers['Access-Control-Allow-Credentials'] = 'true'
    bottle.response.headers['Vary'] = 'Origin'
@bottle.hook('after_request')
def add_safety_headers():
    bottle.response.headers['X-Frame-Options'] = 'deny'
