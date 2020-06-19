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
        if (credentials['id'] != 'turk' and example.uid != credentials['id']) or \
                (credentials['id'] == 'turk' and example.uid != 1):
                    bottle.abort(403, 'Access denied')
        data = bottle.request.json
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
    if not check_fields(data, ['tid', 'rid', 'uid', 'cid', 'hypothesis', 'target', 'response']):
        bottle.abort(400, 'Missing data')
    if data['uid'] != credentials['id']:
        bottle.abort(403, 'Access denied')
    em = ExampleModel()
    # TODO: Add specific Turk account uid? Or add a new turk user every time we see an unseen credential?
    # TODO: Make this accept anything instead of forcing it to be 'prob' (e.g. for QA)
    eid = em.create(tid=data['tid'], rid=data['rid'], uid=data['uid'] if credentials['id'] != 'turk' else 1,
            cid=data['cid'], hypothesis=data['hypothesis'], tgt=data['target'],
            pred=data['response']['prob'], signed=data['response']['signed'])
    if not eid:
        bottle.abort(400, 'Could not create example')

    rm = RoundModel()
    rm.incrementExampleCount(data['tid'], data['rid'])

    return json.dumps({'success': 'ok', 'id': eid})
