import bottle
import common.auth as _auth

from models.model import ModelModel

import json
import logging

@bottle.get('/models/<mid:int>')
def get_model(mid):
    m = ModelModel()
    model = m.get(mid)
    if not model:
        bottle.abort(404, 'Not found')
    # Also get this model's scores?
    return json.dumps(model.to_dict())

@bottle.get('/models/<mid:int>/details')
def get_model_detail(mid):
    try:
        m = ModelModel()
        query_result = m.getModelUserByMid(mid)
        model = query_result[0].to_dict()
        model['user'] = query_result[1].to_dict()
        return json.dumps(model)
    except Exception as ex:
        logging.exception('Model detail exception : (%s)' %(ex))
        bottle.abort(404, 'Not found')
