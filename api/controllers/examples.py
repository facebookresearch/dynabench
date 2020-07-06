import bottle
import common.auth as _auth
from common.helpers import check_fields

from models.example import ExampleModel
from models.round import RoundModel

import json

import logging
from datetime import datetime

@bottle.get('/examples/<eid:int>')
def get_example(eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Not found')
    return json.dumps(example.to_dict())

@bottle.put('/examples/<eid:int>')
@_auth.requires_auth_or_turk
def update_example(credentials, eid):
    try:
        em = ExampleModel()
        example = em.get(eid)
        if not example:
            bottle.abort(404, 'Not found')
        if credentials['id'] != 'turk' and example.uid != credentials['id']:
            bottle.abort(403, 'Access denied')
        data = bottle.request.json
        if credentials['id'] == 'turk':
            if not check_fields(data, ['uid']):
                bottle.abort(400, 'Missing data');
            if data['uid'].startswith('turk|'):
                _, data['annotator_id'], _ = data['uid'].split('|')
            if example.annotator_id != data['annotator_id']:
                bottle.abort(403, 'Access denied')
            del data['uid'] # don't store this

        logging.info("Updating example {} with {}".format(example.id, data))
        em.update(example.id, data)
        return json.dumps({'success': 'ok'})
    except Exception as e:
        logging.error('Error updating example {}: {}'.format(eid, e))
        bottle.abort(500, {'error': str(e)})

@bottle.post('/examples')
@_auth.requires_auth_or_turk
def post_example(credentials):
    data = bottle.request.json
    logging.info(data)
    if not check_fields(data, ['tid', 'rid', 'uid', 'cid', 'hypothesis', 'target', 'response', 'model']):
        bottle.abort(400, 'Missing data')

    if credentials['id'] == 'turk' and data['uid'].startswith('turk|'):
        logging.info(data['uid'])
        _, data['annotator_id'], _ = data['uid'].split('|')
    elif data['uid'] != credentials['id']:
            bottle.abort(403, 'Access denied')
    em = ExampleModel()
    eid = em.create( \
            tid=data['tid'], \
            rid=data['rid'], \
            uid=data['uid'] if credentials['id'] != 'turk' else 'turk', \
            cid=data['cid'], \
            hypothesis=data['hypothesis'], \
            tgt=data['target'], \
            response=data['response'], \
            signed=data['response']['signed'], \
            annotator_id=data['annotator_id'] if credentials['id'] == 'turk' else '', \
            model=data['model']
            )
    if not eid:
        bottle.abort(400, 'Could not create example')

    rm = RoundModel()
    rm.incrementExampleCount(data['tid'], data['rid'])

    return json.dumps({'success': 'ok', 'id': eid})
