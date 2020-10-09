from models.validation import ValidationModel

@bottle.put('/validations/<eid:int>/validate-as-admin-or-owner')
@_auth.requires_auth_or_turk
def validate_example_as_admin_or_owner(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Not found')
    cm = ContextModel()
    context = cm.get(example.cid)
    um = UserModel()
    user = um.get(credentials['id'])
    if not user.admin and not (context.round.task.id, 'owner') in [(perm.tid, perm.type) for perm in user.task_permissions]:
        bottle.abort(403, 'Access denied (you are not an admin or owner of this task)')
    return validate_example(credentials, eid, True)

@bottle.put('/validations/<eid:int>/validate')
@_auth.requires_auth_or_turk
def validate_example_as_user(credentials, eid):
    return validate_example(credentials, eid, False)

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

    if mode == 'owner':
        pass ## TODO:

    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, 'Example not found')

    cm = ContextModel()
    context = cm.get(example.cid)
    um = UserModel()
    user = um.get(credentials['id'])
    if credentials['id'] == 'turk':
        if not util.check_fields(data, ['uid']):
            bottle.abort(400, 'Missing data');
        metadata = json.loads(example.metadata_json)
        if ('annotator_id' not in metadata or metadata['annotator_id'] == data['uid']) and mode != 'owner':
            bottle.abort(403, 'Access denied (cannot validate your own example)')
    elif credentials['id'] == example.uid and mode != 'owner':
        bottle.abort(403, 'Access denied (cannot validate your own example)')
    

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
    rm = RoundModel()
    rm.updateLastActivity(context.r_realid)
    if preds['C'] >= 5 or (validate_as_admin_or_owner and label == 'C'):
        em.update(example.id, {'verified': True, 'verified_correct': True})
        rm.incrementVerifiedFooledCount(context.r_realid)
        um.incrementVerifiedFooledCount(example.uid)
    elif preds['I'] >= 5 or (validate_as_admin_or_owner and label == 'I'):
        em.update(example.id, {'verified': True, 'verified_incorrect': True})
    elif preds['F'] >= 5:
        em.update(example.id, {'verified': True, 'verified_flagged': True})

    # Example has been validated by an admin or owner so is no longer flagged.
    if validate_as_admin_or_owner:
        em.update(example.id, {'verified_flagged': False})

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
