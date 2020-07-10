import bottle

import common.helpers as util

from models.task import TaskModel
from models.round import RoundModel
from models.score import ScoreModel
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
        query_result, total_count = e.getUserLeaderByTid(tid=tid, n=limit, offset=offset)
        return construct_user_board_response_json(query_result=query_result, total_count=total_count)
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
        query_result, total_count = e.getUserLeaderByTidAndRid(tid=tid, rid=rid, n=limit, offset=offset)
        return construct_user_board_response_json(query_result=query_result, total_count=total_count)
    except Exception as ex:
        logging.exception('User leader board data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task/round detail')

def construct_user_board_response_json(query_result, total_count=0):
    list_objs = []
    # converting query result into json object
    for result in query_result:
        obj = {}
        obj['uid'] = result[0]
        obj['username'] = result[1]
        obj['count'] = int(result[2])
        obj['MER'] = str(round(result[3] * 100, 2))
        obj['total'] = str(result[2]) + '/' + str(result[4])
        list_objs.append(obj)
    if list_objs:
        # total_count = query_result[0][len(query_result[0]) - 1]
        resp_obj = {'count': total_count, 'data': list_objs}
        return json.dumps(resp_obj)
    else:
        resp_obj = {'count': 0, 'data': []}
        return json.dumps(resp_obj)

@bottle.get('/tasks/<tid:int>/models')
def get_model_leaderboard(tid):
    """
    Fetch Top perform models based on their test score
    :param tid: Task Id
    :return: Json Object
    """
    try:
        score = ScoreModel()
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getOverallModelPerfByTask(tid=tid, n=limit, offset=offset)
        return construct_model_board_response_json(query_result=query_result, total_count=total_count)
    except Exception as ex:
        logging.exception('Model leader board data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task detail')

@bottle.get('/tasks/<tid:int>/rounds/<rid:int>/models')
def get_model_leaderboard_round(tid, rid):
    """
    Fetch  top perform models based on round and task
    :param tid: Task id
    :param rid: Round id
    :return: Json Object
    """
    score = ScoreModel()
    try:
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getModelPerfByTidAndRid(tid=tid, rid=rid, n=limit, offset=offset)
        return construct_model_board_response_json(query_result=query_result, total_count=total_count)
    except Exception as ex:
        logging.exception('Model leader board data loading failed: (%s)' %(ex))
        bottle.abort(400, 'Invalid task/round detail')

@bottle.get('/tasks/<tid:int>/trends')
def get_task_trends(tid):
    """
    Get top perform models and its round wise performance metrics at task level
    It will fetch only top 10 models and its round wise performance metrics
    :param tid: Task id
    :return: Json Object
    """
    model = ScoreModel()
    try:
        query_result = model.getTrendsByTid(tid=tid)
        logging.info('Top trending model fetch query (%s)' % (query_result))
        return construct_trends_response_json(query_result=query_result)
    except Exception as ex:
        logging.exception('User trends data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task detail')

def construct_model_board_response_json(query_result, total_count):
    fields = ['model_id', 'model_name', 'owner', 'owner_id', 'accuracy']
    dicts = [dict(zip(fields, d)) for d in query_result]
    if dicts:
        resp_obj = {'count': total_count, 'data': dicts}
        return json.dumps(resp_obj)
    else:
        resp_obj = {'count': 0, 'data': []}
        return json.dumps(resp_obj)

def construct_trends_response_json(query_result):
    # construct response to support UI render
    response_obj = {}
    for reslt in query_result:
        if reslt[3] in response_obj.keys():
            val = response_obj[reslt[3]]
            val[reslt[1] + '_' + str(reslt[0])] = reslt[2]
            response_obj[reslt[3]] = val
        else:
            response_obj[reslt[3]] = {'round': reslt[3], reslt[1] + '_' + str(reslt[0]): reslt[2]}
    if response_obj:
        return json.dumps(list(response_obj.values()))
    else:
        return json.dumps([])
