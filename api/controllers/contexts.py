import bottle
import common.auth as _auth

from models.context import ContextModel

import json

@bottle.get('/contexts/<tid:int>/<rid:int>')
def contexts(tid, rid):
    c = ContextModel()
    context = c.getRandom(tid, rid, n=1)
    if not context:
        bottle.abort(500, 'No contexts available')
    context = context[0].to_dict()
    return json.dumps(context)
