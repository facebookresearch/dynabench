import bottle
import common.auth as _auth

from models.task import TaskModel

import json

@bottle.get('/tasks')
def tasks():
    t = TaskModel()
    tasks = t.list()
    return json.dumps(tasks)

@bottle.get('/tasks/<tid:int>')
def get_model(tid):
    t = TaskModel()
    task = t.get(tid)
    if not task:
        bottle.abort(404, 'Not found')
    return json.dumps(task.to_dict())

@bottle.post('/tasks/<tid:int>/<rid:int>')
def addexample(tid, rid):
    # if not logged in abort(401, "Sorry, access denied.")
    pass
