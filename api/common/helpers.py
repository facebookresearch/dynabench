import bottle
import pandas as pd
import numpy as np
import os

import common.auth as _auth
from models.user import UserModel

import logging

def check_fields(data, fields):
    if not data:
        return False
    for f in fields:
        if f not in data:
            return False
    return True

# TODO need to change it in future - to read the test data from db of config files
def load_nli_test_files(config, root_path):
    nli_r1_test_file = pd.read_json(os.path.join(root_path, config['test_file_round_1']), lines=True)
    nli_r2_test_file = pd.read_json(os.path.join(root_path, config['test_file_round_2']), lines=True)
    nli_r3_test_file = pd.read_json(os.path.join(root_path, config['test_file_round_3']), lines=True)
    return nli_r1_test_file, nli_r2_test_file, nli_r3_test_file

def calculate_accuracy(r_objects, target_df, source_key, target_key):
    app = bottle.default_app()
    accuracy_int_list = []
    score_obj_list = []
    split_up = {}
    start_index = 0
    end_index =0
    target_df[target_key + '_lower'] = target_df[target_key].str.lower()
    target_df = target_df.reset_index()
    for r_obj in r_objects:
        obj = {}
        obj['round_id'] = r_obj.id
        obj['desc'] = None
        obj['longdesc'] = None
        source_df = app.config['nli_r' + str(r_obj.rid) + '_test_file']
        end_index = end_index + source_df.shape[0]
        final_df = target_df.iloc[start_index:end_index]
        start_index = end_index
        final_df[source_key + '_lower'] = source_df[source_key].str.lower()
        final_df = final_df[~final_df[target_key].isnull()]
        matched_count = final_df[final_df[target_key + '_lower'] == final_df[source_key + '_lower']].shape[0]
        obj['pretty_perf'] = str(round((matched_count/source_df.shape[0])*100, 2))+' %'
        obj['perf'] = round((matched_count/source_df.shape[0])*100, 2)
        accuracy_int_list.append(round((matched_count/source_df.shape[0])*100, 2))
        split_up[r_obj.rid] =round((matched_count/source_df.shape[0])*100, 2)
        score_obj_list.append(obj)
    return split_up, score_obj_list, round(np.average(accuracy_int_list), 2)

def is_current_user(uid):
    try:
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
