# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import bottle
import common.auth as _auth
import common.helpers as util
from models.validation import ValidationModel
from models.example import ExampleModel
from models.context import ContextModel
from models.user import UserModel
from models.notification import NotificationModel
from models.badge import BadgeModel
from models.round import RoundModel

@bottle.get('/validations/<tid:int>/<rid:int>/flagged')
@_auth.requires_auth
def get_random_flagged_example(credentials, tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    example = em.getRandomVerifiedFlagged(round.id, n=1)
    if not example:
        bottle.abort(500, f'No examples available ({round.id})')
    example = example[0].to_dict()
    return util.json_encode(example)

@bottle.get('/validations/<tid:int>/<rid:int>/unvalidated')
@_auth.requires_auth_or_turk
def get_random_unvalidated_example(credentials, tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    if credentials['id'] != 'turk':
        example = em.getRandomWrong(round.id, n=1, my_uid=credentials['id'])
    else:
        # TODO: Handle this in frontend? Or rejection sample here for N tries
        example = em.getRandomWrong(round.id, n=1)
    if not example:
        bottle.abort(500, f'No examples available ({round.id})')
    example = example[0].to_dict()
    return util.json_encode(example)

@bottle.put('/validations/<eid:int>/validate')
@_auth.requires_auth_or_turk
def validate_example(credentials, eid):
    data = bottle.request.json

    if not data:
        bottle.abort(400, 'Bad request')

    required_fields = ['label', 'mode']
    for field in required_fields:
        if field not in data:
            bottle.abort(400, 'Bad request')

    label = data['label']
    if label not in ['correct', 'incorrect', 'flagged']:
        bottle.abort(400, 'Bad request')

    mode = data['mode']
    if mode not in ['owner', 'user']:
        bottle.abort(400, 'Bad request')

    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Example not found')

    cm = ContextModel()
    context = cm.get(example.cid)
    um = UserModel()
    user = um.get(credentials['id'])
    if mode == 'owner' and not user.admin and not (context.round.task.id, 'owner') in [(perm.tid, perm.type) for perm in user.task_permissions]:
            bottle.abort(403, 'Access denied (you are not an admin or owner of this task)')

    vm = ValidationModel()
    validations = vm.getByEid(eid)
    label_counts = {'flagged': 0, 'correct': 0, 'incorrect': 0}
    for validation in validations:
        label_counts[validation.label.name] += 1
        if validation.uid == credentials['id']:
            bottle.abort(403, 'Access denied (you have already validated this example)')

    if credentials['id'] == 'turk':
        if not util.check_fields(data, ['uid']):
            bottle.abort(400, 'Missing data');
        metadata = json.loads(example.metadata_json)
        if ('annotator_id' not in metadata or metadata['annotator_id'] == data['uid']) and mode != 'owner':
            bottle.abort(403, 'Access denied (cannot validate your own example)')
    elif credentials['id'] == example.uid and mode != 'owner':
        bottle.abort(403, 'Access denied (cannot validate your own example)')

    vm.create(credentials['id'], eid, label, mode)

    rm = RoundModel()
    rm.updateLastActivity(context.r_realid)
    if label_counts['correct'] >= 5 or (mode == 'owner' and label == 'correct'):
        rm.incrementVerifiedFooledCount(context.r_realid)
        um.incrementVerifiedFooledCount(example.uid)

    ret = example.to_dict()
    if credentials['id'] != 'turk':
        user = um.updateValidatedCount(credentials['id'])

        bm = BadgeModel()
        nm = NotificationModel()
        badges = bm.updateSubmitCountsAndCheckBadgesEarned(user, example, 'validate')
        for badge in badges:
            bm.addBadge(badge)
            nm.create(credentials['id'], 'NEW_BADGE_EARNED', badge['name'])
        if badges:
            ret['badges'] = '|'.join([badge['name'] for badge in badges])

    return util.json_encode(ret)
