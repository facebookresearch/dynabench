import bottle
import common.auth as _auth
import common.helpers as util

from models.task import TaskModel
from models.round import RoundModel
from models.example import ExampleModel

import logging
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

@bottle.get('/tasks/<tid:int>/users')
def get_user_leaderboard(tid):
    """
    Return users and MER based on their examples score based on tasks
    :param tid:
    :return: Json Object
    """
    e = ExampleModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result = e.getUserLeaderByTid(tid=tid, n=limit, offset=offset)
        return construct_user_board_response_json(query_result=query_result)
    except Exception as ex:
        logging.exception('User leader board data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task detail')

@bottle.get('/tasks/<tid:int>/rounds/<rid:int>/users')
def get_leaderboard_by_task_and_round(tid, rid):
    """
    Get top leaders based on their examples score for specific task and round
    :param tid: task id
    :param rid: round id
    :return: Json Object
    """
    e = ExampleModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result = e.getUserLeaderByTidAndRid(tid=tid, rid=rid, n=limit, offset=offset)
        return construct_user_board_response_json(query_result=query_result)
    except Exception as ex:
        logging.exception('User leader board data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task/round detail')

def construct_user_board_response_json(query_result):
    list_objs = []
    # converting query result into json object
    for result in query_result:
        obj = {}
        obj['uid'] = result[0]
        obj['username'] = result[1]
        obj['count'] = int(result[2])
        obj['MER'] = str(round(result[3] * 100, 2)) + '%'
        list_objs.append(obj)
    if list_objs:
        total_count = query_result[0][len(query_result[0]) - 1]
        resp_obj = {'count': total_count, 'data': list_objs}
        return json.dumps(resp_obj)
    else:
        resp_obj = {'count': 0, 'data': []}
        return json.dumps(resp_obj)
