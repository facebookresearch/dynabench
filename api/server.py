import bottle
import boto3
import os

import sys
assert len(sys.argv) == 2, "Missing arg (prod or dev?)"
assert sys.argv[1] in ['prod', 'dev'], "Unknown running mode"

running_mode = sys.argv[1]

from common.cors import *
from common.config import *
from common.logging import *
from common.mail_service import *
from common.helpers import *

init_logger(running_mode)

app = bottle.default_app()
for k in ['jwtsecret', 'jwtexp', 'jwtalgo', 'cookie_secret', 'refreshexp', 'forgot_pass_template',
          'smtp_from_email_address', 'smtp_host', 'smtp_port', 'smtp_secret', 'smtp_user', 'email_sender_name']:
    app.config[k] = config[k]

# set up mail service
if 'smtp_user' in config and config['smtp_user'] != '':
    mail = get_mail_session(host=config['smtp_host'], port=config['smtp_port'], smtp_user=config['smtp_user'],
                            smtp_secret=config['smtp_secret'])
    app.config['mail'] = mail

# add the nli test labels in app context -to reduce the turnaround time
ROOT_PATH = os.path.dirname(os.path.realpath('__file__'))
nli_labels = read_nli_round_labels(ROOT_PATH)
app.config['nli_labels'] = nli_labels
app.config['qa_labels'] = read_qa_round_labels(ROOT_PATH)

# initialize sagemaker endpoint if set
if 'sagemaker_aws_access_key_id' in config and config['sagemaker_aws_access_key_id'] != '':
    sagemaker_client = boto3.client('runtime.sagemaker', aws_access_key_id=config['sagemaker_aws_access_key_id'],
                           aws_secret_access_key=config['sagemaker_aws_secret_access_key'],
                           region_name=config['sagemaker_aws_region'])
    app.config['sagemaker_client'] = sagemaker_client

from controllers.index import *
from controllers.auth import *
from controllers.users import *
from controllers.models import *
from controllers.contexts import *
from controllers.tasks import *
from controllers.examples import *
from controllers.endpoints import *

if running_mode == 'dev':
    app.config['mode'] = 'dev'
    bottle.run(host='0.0.0.0', port=8081, debug=True, server='cheroot', reloader=True, certfile='/home/ubuntu/.ssl/dynabench.org.crt', keyfile='/home/ubuntu/.ssl/dynabench.org-key.pem')
elif running_mode == 'prod':
    app.config['mode'] = 'prod'
    bottle.run(host='0.0.0.0', port=8080, debug=True, server='cheroot') # , certfile='', keyfile=''
