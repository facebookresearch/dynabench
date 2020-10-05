# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle
import common.auth as _auth
import common.helpers as util

from models.example import ExampleModel
from models.round import RoundModel
from models.context import ContextModel

import json

from collections import Counter

import logging
from datetime import datetime

@bottle.get('/examples/<tid:int>/<rid:int>')
@_auth.requires_auth
def get_random_example(credentials, tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    example = em.getRandomWrong(round.id, n=1)
    if not example:
        bottle.abort(500, f'No examples available ({round.id})')
    example = example[0].to_dict()
    return util.json_encode(example)

@bottle.get('/examples/<eid:int>')
@_auth.requires_auth
def get_example(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Not found')
    if example.uid != credentials['id']:
        bottle.abort(403, 'Access denied')
    return util.json_encode(example.to_dict())

@bottle.put('/examples/<eid:int>/validate')
@_auth.requires_auth
def validate_example(credentials, eid):
    data = bottle.request.json
    if not data or 'label' not in data:
        bottle.abort(400, 'Bad request')
    label = data['label']
    if label not in ['C', 'I', 'F']:
        bottle.abort(400, 'Bad request')
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Not found')
    nobj = example.verifier_preds
    if nobj is None:
        nobj = ''
    else:
        nobj += '|'
    nobj += str(credentials['id']) + ',' + label
    em.update(example.id, {
        'verifier_preds': nobj,
        'total_verified': example.total_verified + 1
    })
    preds = Counter([x.split(",")[1] for x in nobj.split("|")])
    if preds['C'] >= 5:
        em.update(example.id, {'verified': True, 'verified_correct': True})
    elif preds['I'] >= 5:
        em.update(example.id, {'verified': True, 'verified_incorrect': True})
    elif preds['F'] >= 5:
        em.update(example.id, {'verified': True, 'verified_flagged': True})
    return util.json_encode(example.to_dict())

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
            if not util.check_fields(data, ['uid']):
                bottle.abort(400, 'Missing data');
            metadata = json.loads(example.metadata_json)
            if 'annotator_id' not in metadata or metadata['annotator_id'] != data['uid']:
                bottle.abort(403, 'Access denied')
            del data['uid'] # don't store this

        logging.info("Updating example {} with {}".format(example.id, data))
        em.update(example.id, data)
        return util.json_encode({'success': 'ok'})
    except Exception as e:
        logging.error('Error updating example {}: {}'.format(eid, e))
        bottle.abort(500, {'error': str(e)})

@bottle.post('/examples')
@_auth.requires_auth_or_turk
def post_example(credentials):
    data = bottle.request.json

    if not util.check_fields(data, ['tid', 'rid', 'uid', 'cid', 'hypothesis', 'target', 'response', 'metadata']):
        bottle.abort(400, 'Missing data')

    if credentials['id'] == 'turk':
        if 'annotator_id' not in data['metadata']:
            bottle.abort(400, 'Missing annotator data')
    elif int(data['uid']) != credentials['id']:
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
            metadata=data['metadata']
            )
    if not eid:
        bottle.abort(400, 'Could not create example')

    rm = RoundModel()
    rm.incrementExampleCount(data['tid'], data['rid'])
    cm = ContextModel()
    cm.incrementCountDate(data['cid'])

    return util.json_encode({'success': 'ok', 'id': eid})
