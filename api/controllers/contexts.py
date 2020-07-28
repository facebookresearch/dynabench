import bottle
import common.auth as _auth

from models.round import RoundModel
from models.context import ContextModel

import json

@bottle.get('/contexts/<tid:int>/<rid:int>')
@bottle.get('/contexts/<tid:int>/<rid:int>/min')
def getContext(tid, rid):
    return _getContext(tid, rid)

@bottle.get('/contexts/<tid:int>/<rid:int>/uniform')
def getUniformContext(tid, rid):
    return _getContext(tid, rid, 'uniform')

def _getContext(tid, rid, method='min'):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    c = ContextModel()
    if method == 'uniform':
        context = c.getRandom(round.id, n=1)
    elif method == 'min':
        context = c.getRandomMin(round.id, n=1)
    if not context:
        bottle.abort(500, f'No contexts available ({round.id})')
    context = context[0].to_dict()
    return json.dumps(context)
