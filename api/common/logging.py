# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys

import bottle

import logging
import os

from datetime import datetime

def init_logger(mode):
    logger = logging.getLogger()

    logger.setLevel(logging.NOTSET)

    stderr_handler = logging.StreamHandler(sys.stdout)
    stderr_handler.setLevel(logging.DEBUG)
    logger.addHandler(stderr_handler)

    os.makedirs("../logs", exist_ok=True)
    file_handler = logging.FileHandler(f'../logs/dynabench-server-{mode}.log')
    formatter = logging.Formatter('%(asctime)s %(msg)s')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

@bottle.hook('after_request')
def logger_hook():
    request_time = datetime.now()
    logger.info('%s %s %s %s %s' % (bottle.request.remote_addr,
                                    request_time,
                                    bottle.request.method,
                                    bottle.request.url,
                                    bottle.response.status))

logger = logging.getLogger('dynabench')
