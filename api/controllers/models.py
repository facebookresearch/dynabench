import bottle
import common.auth as _auth

from models.model import ModelModel

import json

@bottle.get('/models/<mid:int>')
def get_model(mid):
    m = ModelModel()
    model = m.get(mid)
    if not model:
        bottle.abort(404, 'Not found')
    # Also get this model's scores?
    return json.dumps(model.to_dict())
