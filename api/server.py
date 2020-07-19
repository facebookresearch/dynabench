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
          'smtp_from_email_address', 'smtp_host', 'smtp_port', 'smtp_secret', 'smtp_user', 'email_sender_name',
          'aws_s3_bucket_name', 'aws_s3_profile_base_url', 'profile_img_max_size']:
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
if 'aws_access_key_id' in config and config['aws_access_key_id'] != '':
    sagemaker_client = boto3.client('runtime.sagemaker', aws_access_key_id=config['aws_access_key_id'],
                           aws_secret_access_key=config['aws_secret_access_key'],
                           region_name=config['aws_region'])
    app.config['sagemaker_client'] = sagemaker_client

    #setup s3 service for profile picture upload
    s3_service = boto3.client('s3', aws_access_key_id=config['aws_access_key_id'],
                 aws_secret_access_key=config['aws_secret_access_key'],
                 region_name=config['aws_region'])
    app.config['s3_service'] = s3_service

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
    # Assertion for necessary configuration
    if not check_fields(config, ['smtp_user', 'smtp_host', 'smtp_port', 'smtp_secret']) or \
            is_fields_blank(config, ['smtp_user', 'smtp_host', 'smtp_port', 'smtp_secret']):
        raise AssertionError('Config SMTP server detail')

    if not check_fields(config, ['aws_access_key_id', 'aws_secret_access_key', 'aws_region', 'aws_s3_bucket_name']) or \
            is_fields_blank(config, ['aws_access_key_id', 'aws_secret_access_key', 'aws_region', 'aws_s3_bucket_name']):
        raise AssertionError('Config AWS service detail')

    app.config['mode'] = 'prod'
    bottle.run(host='0.0.0.0', port=8080, debug=True, server='cheroot') # , certfile='', keyfile=''
