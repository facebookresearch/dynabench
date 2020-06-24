import bottle
import logging

@bottle.route('/<:re:.*>', method='OPTIONS')
def enable_cors_generic_route():
    add_cors_headers()
@bottle.hook('after_request')
def enable_cors_after_request_hook():
    add_cors_headers()
def add_cors_headers():
    valid_cors_urls = [
            'https://54.187.22.210',
            'https://54.187.22.210:3000',
            'https://dynabench.org:3000',
            'http://www.dynabench.org:3001', # Mturk dev interface
            'https://www.dynabench.org',
            'https://www.dynabench.org:3000',
            'https://beta.dynabench.org',
            'https://beta.dynabench.org:3000',
            'https://localhost:3000',
            'http://localhost:3000',
            'https://localhost:3001',
            'http://localhost:3001']
    if bottle.request.get_header('origin') not in valid_cors_urls:
        host = 'https://dynabench.org'
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
