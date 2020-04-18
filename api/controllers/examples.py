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
@_auth.requires_auth
def update_example(credentials, eid):
    try:
        em = ExampleModel()
        example = em.get(eid)
        if not example:
            bottle.abort(404, 'Not found')
        if not example.uid == credentials['id']:
            bottle.abort(403, 'Access denied')
        data = bottle.request.json
        logging.info("Updating example {} with {}".format(example.id, data))
        em.update(example.id, data)
        return json.dumps({'success': 'ok'})
    except Exception as e:
        logging.error('Error updating example {}: {}'.format(eid, e))
        bottle.abort(500, {'error': str(e)})

@bottle.post('/examples')
@_auth.requires_auth
def post_example(credentials):
    data = bottle.request.json
    logging.info(data)
    if not check_fields(data, ['tid', 'rid', 'uid', 'cid', 'hypothesis', 'target', 'response']):
        bottle.abort(400, 'Missing data')
    if data['uid'] != credentials['id']:
        bottle.abort(403, 'Access denied')
    em = ExampleModel()
    eid = em.create(tid=data['tid'], rid=data['rid'], uid=data['uid'], cid=data['cid'], hypothesis=data['hypothesis'], tgt=data['target'], pred=data['response']['prob'], signed=data['response']['signed'])
    if not eid:
        bottle.abort(400, 'Could not create example')

    rm = RoundModel()
    rm.incrementExampleCount(data['tid'], data['rid'])

    return json.dumps({'success': 'ok', 'id': eid})
