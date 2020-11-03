# Copyright (c) Facebook, Inc. and its affiliates.

import json

import bottle
import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.badge import BadgeModel
from models.context import ContextModel
from models.example import ExampleModel
from models.notification import NotificationModel
from models.round import RoundModel
from models.task import TaskModel
from models.user import UserModel


@bottle.get(
    "/examples/<tid:int>/<rid:int>/filtered/<min_num_flags:int>/"
    + "<max_num_flags:int>/<min_num_disagreements:int>/<max_num_disagreements:int>"
)
@_auth.requires_auth
def get_random_filtered_example(
    credentials,
    tid,
    rid,
    min_num_flags,
    max_num_flags,
    min_num_disagreements,
    max_num_disagreements,
):
    tm = TaskModel()
    task = tm.get(tid)
    validate_non_fooling = False
    if task.settings_json:
        settings = json.loads(task.settings_json)
        validate_non_fooling = settings["validate_non_fooling"]
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    example = em.getRandomFiltered(
        round.id,
        min_num_flags,
        max_num_flags,
        min_num_disagreements,
        max_num_disagreements,
        validate_non_fooling,
        n=1,
    )
    if not example:
        bottle.abort(500, f"No examples available ({round.id})")
    example = example[0].to_dict()
    return util.json_encode(example)


@bottle.get("/examples/<tid:int>/<rid:int>")
@_auth.requires_auth_or_turk
def get_random_example(credentials, tid, rid):
    tm = TaskModel()
    task = tm.get(tid)
    validate_non_fooling = False
    num_matching_validations = 3
    if task.settings_json:
        settings = json.loads(task.settings_json)
        validate_non_fooling = settings["validate_non_fooling"]
        num_matching_validations = settings["num_matching_validations"]
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    if credentials["id"] != "turk":
        example = em.getRandom(
            round.id,
            validate_non_fooling,
            num_matching_validations,
            n=1,
            my_uid=credentials["id"],
        )
    else:
        example = em.getRandom(
            round.id, validate_non_fooling, num_matching_validations, n=1
        )
    if not example:
        bottle.abort(500, f"No examples available ({round.id})")
    example = example[0].to_dict()
    return util.json_encode(example)


@bottle.get("/examples/<eid:int>")
@_auth.requires_auth
def get_example(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, "Not found")
    if example.uid != credentials["id"]:
        bottle.abort(403, "Access denied")
    return util.json_encode(example.to_dict())


@bottle.get("/examples/<eid:int>/metadata")
@_auth.requires_auth
def get_example_metadata(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, "Not found")
    if example.uid != credentials["id"]:
        bottle.abort(403, "Access denied")
    return util.json_encode(example.metadata_json)


@bottle.put("/examples/<eid:int>")
@_auth.requires_auth_or_turk
def update_example(credentials, eid):
    try:
        em = ExampleModel()
        example = em.get(eid)
        if not example:
            bottle.abort(404, "Not found")
        if credentials["id"] != "turk" and example.uid != credentials["id"]:
            bottle.abort(403, "Access denied")
        data = bottle.request.json
        if credentials["id"] == "turk":
            if not util.check_fields(data, ["uid"]):
                bottle.abort(400, "Missing data")
            metadata = json.loads(example.metadata_json)
            if (
                "annotator_id" not in metadata
                or metadata["annotator_id"] != data["uid"]
            ):
                bottle.abort(403, "Access denied")
            del data["uid"]  # don't store this

        logger.info(f"Updating example {example.id} with {data}")
        em.update(example.id, data)
        if "retracted" in data and data["retracted"] is True:
            um = UserModel()
            um.incrementRetractedCount(example.uid)
        return util.json_encode({"success": "ok"})
    except Exception as e:
        logger.error(f"Error updating example {eid}: {e}")
        bottle.abort(500, {"error": str(e)})


@bottle.post("/examples")
@_auth.requires_auth_or_turk
def post_example(credentials):
    data = bottle.request.json

    if not util.check_fields(
        data,
        ["tid", "rid", "uid", "cid", "hypothesis", "target", "response", "metadata"],
    ):
        bottle.abort(400, "Missing data")

    if credentials["id"] == "turk":
        if "annotator_id" not in data["metadata"]:
            bottle.abort(400, "Missing annotator data")
    elif int(data["uid"]) != credentials["id"]:
        bottle.abort(403, "Access denied")

    em = ExampleModel()
    example = em.create(
        tid=data["tid"],
        rid=data["rid"],
        uid=data["uid"] if credentials["id"] != "turk" else "turk",
        cid=data["cid"],
        hypothesis=data["hypothesis"],
        tgt=data["target"],
        response=data["response"],
        metadata=data["metadata"],
    )
    if not example:
        bottle.abort(400, "Could not create example")

    rm = RoundModel()
    rm.incrementCollectedCount(data["tid"], data["rid"])
    cm = ContextModel()
    cm.incrementCountDate(data["cid"])
    context = cm.get(example.cid)
    rm.updateLastActivity(context.r_realid)
    if example.model_wrong:
        rm.incrementFooledCount(context.r_realid)
    if credentials["id"] != "turk":
        um = UserModel()
        if example.model_wrong:
            um.incrementFooledCount(example.uid)
        bm = BadgeModel()
        nm = NotificationModel()
        user = um.get(credentials["id"])
        badges = bm.updateSubmitCountsAndCheckBadgesEarned(user, example, "create")
        for badge in badges:
            bm.addBadge(badge)
            nm.create(credentials["id"], "NEW_BADGE_EARNED", badge["name"])

    return util.json_encode(
        {
            "success": "ok",
            "id": example.id,
            "badges": "|".join([badge["name"] for badge in badges])
            if (credentials["id"] != "turk" and badges)
            else None,
        }
    )
