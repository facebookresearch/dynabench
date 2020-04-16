import bottle

import sys
assert len(sys.argv) == 2, "Missing arg (prod or dev?)"
assert sys.argv[1] in ['prod', 'dev'], "Unknown running mode"

running_mode = sys.argv[1]

from common.cors import *
from common.config import *
from common.logging import *

init_logger(running_mode)

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

if running_mode == 'dev':
    bottle.run(host='0.0.0.0', port=8081, debug=True, reloader=True)
elif running_mode == 'prod':
    bottle.run(host='0.0.0.0', port=8080, debug=True, server='cheroot') # , certfile='', keyfile=''
