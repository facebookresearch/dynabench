import bottle

import logging

from datetime import datetime

def init_logger(mode):
    logger = logging.getLogger('dynabench')
    logger.setLevel(logging.INFO)
    file_handler = logging.FileHandler(f'../logs/dynabench-server-{mode}.log')
    formatter = logging.Formatter('%(msg)s')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

@bottle.hook('after_request')
def logger_hook():
    logger = logging.getLogger('dynabench')
    request_time = datetime.now()
    logger.info('%s %s %s %s %s' % (bottle.request.remote_addr,
                                    request_time,
                                    bottle.request.method,
                                    bottle.request.url,
                                    bottle.response.status))
