import bottle
import os
from urllib.parse import urlparse

import common.auth as _auth
from models.user import UserModel

import logging
import json

def check_fields(data, fields):
    if not data:
        return False
    for f in fields:
        if f not in data:
            return False
    return True

# TODO need to change it in future - to read the test data from db of config files
def read_nli_round_labels(root_path):
    """
    Load the files from NLI directory and label them automatically
    :param root_path: We assume anli_v0.1 test set present in api folder
    :return: Dict object
    """

    full_path = root_path + '/nli'
    r_file_paths = [name for name in os.listdir(full_path) if os.path.isdir(os.path.join(full_path, name))]
    nli_labels = {}
    for r_file_path in r_file_paths:
        r_num = r_file_path[len(r_file_path)-1:len(r_file_path)]
        r_file_path = full_path + '/' + r_file_path
        nli_labels[int(r_num)] = [json.loads(l)['label'].lower() for l in open(f'{r_file_path}/test.jsonl').read().splitlines()]
    return nli_labels

def get_accuracy(prediction, target):
    """
    Calculate accuracy compared with target label and prediction label
    :param prediction: model predicted label
    :param target: correctly labeled set
    :return: int accuracy value
    """

    return sum(1 if prediction[index] == target[index] else 0 for index in range(len(target))) / len(target)

def validate_prediction(r_objects, prediction):
    """
    Function help as calculated the accuracy and convert them into scores object
    :param r_objects: Rounds object
    :param prediction: Prediction result
    :return: Score objects, ui response object and overall accuracy
    """

    app = bottle.default_app()
    target_labels = app.config['nli_labels']
    # validate prediction and target labels length
    if len(r_objects) > 1 and len(prediction) != len(sum(target_labels.values(), [])):
        raise AssertionError('Prediction and target file length mismatch')
    elif len(r_objects) == 1 and len(target_labels[r_objects[0].rid]) != len(prediction):
        raise AssertionError('Prediction and target file length mismatch')

    overall_accuracy = 0
    score_obj_list = []
    split_up = {}
    start_index = 0
    end_index = 0
    for r_obj in r_objects:
        score_obj = {}
        score_obj['round_id'] = r_obj.id
        score_obj['desc'] = None
        score_obj['longdesc'] = None
        # slice and extract round specific prediction
        end_index = end_index + len(target_labels[r_obj.rid])
        r_prediction = prediction[start_index: end_index]
        start_index = end_index
        r_accuracy = get_accuracy(r_prediction, target_labels[r_obj.rid])
        score_obj['pretty_perf'] = str(round(r_accuracy*100, 2))+' %'
        score_obj['perf'] = round(r_accuracy*100, 2)
        # sum rounds accuracy and generate score object list
        overall_accuracy = overall_accuracy + round(r_accuracy*100, 2)
        split_up[r_obj.rid] = round(r_accuracy*100, 2)
        score_obj_list.append(score_obj)

    return split_up, score_obj_list, round(overall_accuracy/len(r_objects), 2)

def is_current_user(uid, credentials=None):
    """
    Validate the user id is currently logged in one.
    :param uid: User id
    :param credentials: Authorization detail
    :return: Boolean
    """
    try:
        if not credentials:
            token = _auth.jwt_token_from_header()
            credentials = _auth.get_payload(token)
        u = UserModel()
        user = u.get(uid)
        if not user:
            return False
        if uid != credentials['id']:
            return False
        return True
    except Exception as ex:
        logging.exception('Current user  verification failed  for (%s) exception : %s ' %(uid, ex))
        return False

def get_limit_and_offset_from_request():
    """
    Extract the limit and offset value from request
    which is help to design the pagination
    :return: limit, offset
    """

    try:
        limit = bottle.request.query.get('limit')
        offset = bottle.request.query.get('offset')
        if not limit:
            limit = 5
        if not offset:
            offset = 0
        # handle if limit in string like ss
        limit = int(limit)
        offset = int(offset)
    except Exception as ex:
        logging.exception('Query param parsing issue :(%s)' %(ex))
        limit = 5
        offset = 0

    return limit, offset

def parse_url(url):
    """
    parse and extract the host name and server scheme from request url
    :param url:
    :return: url hostname {https://dynabench.org}
    """

    try:
        host_name = bottle.request.get_header('origin')
        if not host_name:
            parsed_uri = urlparse(url)
            formed_url = '{uri.scheme}://{uri.netloc}'.format(uri=parsed_uri)
            return formed_url
        return host_name
    except Exception as ex:
        return "https://dynabench.org"
