# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger

from models.task import TaskModel
from models.round import RoundModel
from models.score import ScoreModel
from models.example import ExampleModel
from models.user import UserModel
from models.validation import ValidationModel

import json

@bottle.get('/tasks')
def tasks():
    t = TaskModel()
    tasks = t.listWithRounds()
    return util.json_encode(tasks)

@bottle.get('/tasks/<tid:int>')
def get_task(tid):
    t = TaskModel()
    task = t.getWithRound(tid)
    if not task:
        bottle.abort(404, 'Not found')
    return util.json_encode(task)

@bottle.get('/tasks/<tid:int>/<rid:int>')
def get_task_round(tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    if not round:
        bottle.abort(404, 'Not found')
    return util.json_encode(round.to_dict())

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
        logger.exception('User leader board data loading failed: (%s)' % (ex))
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
        logger.exception('User leader board data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task/round detail')

def get_example_dict_list_with_anonymized_validations(examples):
    example_dict_list = []
    vm = ValidationModel()
    for example in examples:
        example_dict = example.to_dict()
        validations = vm.getByEid(example.id)
        example_dict['validation_labels'] = []
        for validation in validations:
            example_dict['validation_labels'].append(validation.label.name)
        example_dict_list.append(example_dict)
    return example_dict_list

@bottle.get('/tasks/<tid:int>/rounds/<rid:int>/export')
@_auth.requires_auth
def export_current_round_data(credentials, tid, rid):
    um = UserModel()
    user = um.get(credentials['id'])
    if not user.admin:
        if (tid, 'owner') not in [(perm.tid, perm.type) for perm in user.task_permissions]:
            bottle.abort(403, 'Access denied')
    e = ExampleModel()
    examples = e.getByTidAndRid(tid, rid)
    return util.json_encode(
        get_example_dict_list_with_anonymized_validations(examples))

@bottle.get('/tasks/<tid:int>/export')
@_auth.requires_auth
def export_task_data(credentials, tid):
    um = UserModel()
    user = um.get(credentials['id'])
    if not user.admin:
        if (tid, 'owner') not in [(perm.tid, perm.type) for perm in user.task_permissions]:
            bottle.abort(403, 'Access denied')
    e = ExampleModel()
    examples = e.getByTid(tid)
    return util.json_encode(
        get_example_dict_list_with_anonymized_validations(examples))

def construct_user_board_response_json(query_result, total_count=0):
    list_objs = []
    # converting query result into json object
    for result in query_result:
        obj = {}
        obj['uid'] = result[0]
        obj['username'] = result[1]
        obj['avatar_url'] = result[2] if result[2] is not None else ''
        obj['count'] = int(result[3])
        obj['MER'] = str(round(result[4] * 100, 2))
        obj['total'] = str(result[3]) + '/' + str(result[5])
        list_objs.append(obj)
    if list_objs:
        # total_count = query_result[0][len(query_result[0]) - 1]
        resp_obj = {'count': total_count, 'data': list_objs}
        return util.json_encode(resp_obj)
    else:
        resp_obj = {'count': 0, 'data': []}
        return util.json_encode(resp_obj)

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
        logger.exception('Model leader board data loading failed: (%s)' % (ex))
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
        logger.exception('Model leader board data loading failed: (%s)' %(ex))
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
        return construct_trends_response_json(query_result=query_result)
    except Exception as ex:
        logger.exception('User trends data loading failed: (%s)' % (ex))
        bottle.abort(400, 'Invalid task detail')

def construct_model_board_response_json(query_result, total_count):
    fields = ['model_id', 'model_name', 'owner', 'owner_id', 'accuracy']
    dicts = [dict(zip(fields, d)) for d in query_result]
    if dicts:
        resp_obj = {'count': total_count, 'data': dicts}
        return util.json_encode(resp_obj)
    else:
        resp_obj = {'count': 0, 'data': []}
        return util.json_encode(resp_obj)

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
        return util.json_encode(list(response_obj.values()))
    else:
        return util.json_encode([])
