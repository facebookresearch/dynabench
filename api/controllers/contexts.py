import bottle
import common.auth as _auth

from models.round import RoundModel
from models.context import ContextModel

import json

@bottle.get('/contexts/<tid:int>/<rid:int>')
def contexts(tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    c = ContextModel()
    context = c.getRandom(round.id, n=1)
    if not context:
        bottle.abort(500, f'No contexts available ({round.id})')
    context = context[0].to_dict()
    return json.dumps(context)
