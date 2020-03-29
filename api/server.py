import bottle

import sys

import logging

from common.cors import *
from common.config import *

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

app = bottle.default_app()
for k in ['jwtsecret', 'jwtexp', 'jwtalgo', 'cookie_secret', 'refreshexp']:
    app.config[k] = config[k]

from controllers.index import *
from controllers.auth import *
from controllers.users import *
from controllers.models import *
from controllers.contexts import *
from controllers.tasks import *
from controllers.examples import *

bottle.run(host='0.0.0.0', port=8080, debug=True, reloader=True)
