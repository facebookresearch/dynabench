import bottle
import os

import sys
assert len(sys.argv) == 2, "Missing arg (prod or dev?)"
assert sys.argv[1] in ['prod', 'dev'], "Unknown running mode"

running_mode = sys.argv[1]

from common.cors import *
from common.config import *
from common.logging import *
from common.helpers import *

init_logger(running_mode)

app = bottle.default_app()
for k in ['jwtsecret', 'jwtexp', 'jwtalgo', 'cookie_secret', 'refreshexp']:
    app.config[k] = config[k]

# add the nli test file in app context
ROOT_PATH = os.path.dirname(os.path.realpath('__file__'))
nli_r1_test_file, nli_r2_test_file, nli_r3_test_file = load_nli_test_files(config, ROOT_PATH)
app.config['nli_r1_test_file'] = nli_r1_test_file
app.config['nli_r2_test_file'] = nli_r2_test_file
app.config['nli_r3_test_file'] = nli_r3_test_file

from controllers.index import *
from controllers.auth import *
from controllers.users import *
from controllers.models import *
from controllers.contexts import *
from controllers.tasks import *
from controllers.examples import *

if running_mode == 'dev':
    app.config['mode'] = 'dev'
    bottle.run(host='0.0.0.0', port=8081, debug=True, server='cheroot', reloader=True, certfile='/home/ubuntu/.ssl/dynabench.org.crt', keyfile='/home/ubuntu/.ssl/dynabench.org-key.pem')
elif running_mode == 'prod':
    app.config['mode'] = 'prod'
    bottle.run(host='0.0.0.0', port=8080, debug=True, server='cheroot') # , certfile='', keyfile=''
