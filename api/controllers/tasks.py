import bottle
import common.auth as _auth

from models.task import TaskModel
from models.round import RoundModel

import json

@bottle.get('/tasks')
def tasks():
    t = TaskModel()
    tasks = t.listWithRounds()
    return json.dumps(tasks)

@bottle.get('/tasks/<tid:int>')
def get_task(tid):
    t = TaskModel()
    task = t.getWithRound(tid)
    if not task:
        bottle.abort(404, 'Not found')
    return json.dumps(task)

@bottle.get('/tasks/<tid:int>/<rid:int>')
def get_task_round(tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    if not round:
        bottle.abort(404, 'Not found')
    return json.dumps(round.to_dict())
