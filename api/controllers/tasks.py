import bottle
import boto3
import common.auth as _auth
import common.helpers as util

from models.task import TaskModel
from models.round import RoundModel
from models.score import ScoreModel

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
        query_result = score.getOverallModelPerfByTask(tid=tid, n=limit, offset=offset)
        return construct_model_board_response_json(query_result=query_result)
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
        query_result = score.getModelPerfByTidAndRid(tid=tid, rid=rid, n=limit, offset=offset)
        return construct_model_board_response_json(query_result=query_result)
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

@bottle.post('/tasks/<tid:int>/create/<endpoint>')
@_auth.requires_auth
def get_model_preds(credentials, tid, endpoint):
    """Takes context and hypothesis, invokes Sagemaker model endpoint and returns the prediction results
    ----------
    request - json object in below format
    {
        "context": "Please pretend you a reviewing a place, product, book or movie.",
        "hypothesis": "It was a nice movie"
    }

    returns - a json object with probability and signed
    """
    sagemaker_client = bottle.default_app().config['sagemaker_client']
    payload = bottle.request.json
    if 'hypothesis' not in payload or 'context' not in payload or len(payload['hypothesis']) < 1 or \
            len(payload['context']) < 1:
        bottle.abort(400, 'Missing data')

    # Invoke sagemaker endpoint to get model result
    try:
        logging.info("Example: {}".format(payload['hypothesis']))
        response = sagemaker_client.invoke_endpoint(EndpointName=endpoint,
                                       ContentType='application/json',
                                       Body=json.dumps(payload))
    except Exception as error_message:
        logging.info('Error in prediction: %s' % (error_message))
        bottle.abort(400, 'Error in prediction: %s' % (error_message))

    result = response['Body'].read()
    logging.info('Model response %s' % (result))
    return result

def construct_model_board_response_json(query_result):
    fields = ['model_id', 'model_name', 'owner', 'owner_id', 'accuracy', 'total_counts']
    dicts = [dict(zip(fields, d)) for d in query_result]
    if dicts:
        total_count = query_result[0][len(fields) - 1]
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
