import bottle
import logging

@bottle.route('/<:re:.*>', method='OPTIONS')
def enable_cors_generic_route():
    add_cors_headers()
@bottle.hook('after_request')
def enable_cors_after_request_hook():
    add_cors_headers()
def add_cors_headers():
    # TODO: https
    valid_cors_urls = [
            'http://54.187.22.210',
            'http://54.187.22.210:3000',
            'http://dynabench.org:3000',
            'http://www.dynabench.org',
            'http://www.dynabench.org:3000',
            'http://beta.dynabench.org',
            'http://beta.dynabench.org:3000']
    if bottle.request.get_header('origin') not in valid_cors_urls:
        host = 'http://dynabench.org'
    else:
        host = bottle.request.get_header('origin')
    app = bottle.default_app()
    bottle.response.headers['Access-Control-Allow-Origin'] = host
    bottle.response.headers['Access-Control-Allow-Methods'] = \
        'GET, POST, PUT, OPTIONS'
    bottle.response.headers['Access-Control-Allow-Headers'] = \
        'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization'
    bottle.response.headers['Access-Control-Allow-Credentials'] = 'true'
@bottle.hook('after_request')
def add_safety_headers():
    bottle.response.headers['X-Frame-Options'] = 'deny'
