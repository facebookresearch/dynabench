import bottle

@bottle.route('/')
def index():
    return '<b>Hello world</b>!'
