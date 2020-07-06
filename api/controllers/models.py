import sqlalchemy as db
import bottle

import common.auth as _auth
import common.helpers as  util
from common.helpers import check_fields

from models.model import ModelModel
from models.score import ScoreModel
from models.round import RoundModel
from models.user import UserModel

import json
import logging

@bottle.get('/models/<mid:int>')
def get_model(mid):
    m = ModelModel()
    model = m.get(mid)
    if not model:
        bottle.abort(404, 'Not found')
    # Also get this model's scores?
    return json.dumps(model.to_dict())

@bottle.get('/models/<mid:int>/details')
def get_model_detail(mid):
    try:
        m = ModelModel()
        query_result = m.getModelUserByMid(mid)
        model = query_result[0].to_dict()
        model['user'] = query_result[1].to_dict()
        return json.dumps(model)
    except Exception as ex:
        logging.exception('Model detail exception : (%s)' %(ex))
        bottle.abort(404, 'Not found')

@bottle.post('/models/upload')
@_auth.requires_auth
def do_upload(credentials):
    """
    Upload the result file fpr overall round or specified round like 1,2,3
    and save those result into models and scores table
    :param credentials:
    :return: Models scores detail
    """
    user = UserModel()
    user_id = credentials['id']
    u = user.get(user_id)
    if not u:
        logging.error('Invalid user detail for id (%s)' %(user_id))
        bottle.abort(404, 'User information not found')

    round_id = bottle.request.forms.get('type')
    upload = bottle.request.files.get('file')
    task_id = bottle.request.forms.get('taskId')

    try:
        test_raw_data = upload.file.read().decode('utf-8').lower().splitlines()
    except Exception as ex:
        logging.exception(ex)
        bottle.abort(400, 'Upload valid model result file')
    # Round object fetch from DB
    round = RoundModel()
    if round_id == 'overall':
        r_objects = round.getByTid(task_id)
    else:
        r_objects = [round.getByTidAndRid(task_id, round_id)]
    if not r_objects:
        bottle.abort(400, 'Model evaluation  failed')
    # Model result validate and score object save into db
    if len(test_raw_data) > 0:
        try:
            split_up, score_obj_list, overall_accuracy = util.validate_prediction(r_objects, test_raw_data)
            model = ModelModel()
            m = model.create(task_id=task_id, user_id=user_id, name='', shortname='', overall_perf=str(overall_accuracy))
            score = ScoreModel()
            s = score.bulk_create(model_id=m.id, score_objs=score_obj_list)
            #Construct response object
            response = {
                "model_id": m.id,
                "scores": split_up,
                "is_published": False,
                "accuracy": overall_accuracy
            }
            return json.dumps(response)
        except AssertionError:
            bottle.abort(400, 'Submission file length mismatch')
        except Exception as error_message:
            logging.exception('Model evaluation failed: %s' % (error_message))
            bottle.abort(400, 'Model evaluation failed: %s'% (error_message))
    else:
        bottle.abort(400, 'Invalid file submitted')

@bottle.put('/models/<model_id>/publish')
@_auth.requires_auth
def publish_model(credentials, model_id):
    model = ModelModel()
    data = bottle.request.json
    if not check_fields(data, ['name', 'description']):
        bottle.abort(400, 'Missing data')

    try:
        m = model.getUnpublishedModelByMid(id=model_id)
        if m.uid != credentials['id']:
            logging.error('Original user (%s) and the modification tried by (%s)' % (m.uid, credentials['id']))
            bottle.abort(401, 'Operation not authorized')

        m = model.update(id=m.id, name=data['name'], longdesc=data['description'], is_published=True)

        return {'status': 'success'}
    except db.orm.exc.NoResultFound as ex:
        bottle.abort(404, 'Model Not found')
    except Exception as e:
        logging.exception('Could not update model details: %s' % (e))
        bottle.abort(400, 'Could not update model details: %s' % (e))