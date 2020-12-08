# Copyright (c) Facebook, Inc. and its affiliates.

import json

import bottle

import common.auth as _auth
import common.helpers as util
from models.badge import BadgeModel
from models.context import ContextModel
from models.example import ExampleModel
from models.round import RoundModel
from models.task import TaskModel
from models.user import UserModel
from models.validation import ValidationModel


@bottle.put("/validations/<eid:int>")
@_auth.requires_auth_or_turk
def validate_example(credentials, eid):
    data = bottle.request.json

    if not data:
        bottle.abort(400, "Bad request")

    required_fields = ["label", "mode"]
    for field in required_fields:
        if field not in data:
            bottle.abort(400, "Bad request")

    label = data["label"]
    if label not in ["correct", "incorrect", "flagged"]:
        bottle.abort(400, "Bad request")

    mode = data["mode"]
    if mode not in ["owner", "user"]:
        bottle.abort(400, "Bad request")

    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, "Example not found")

    cm = ContextModel()
    context = cm.get(example.cid)
    um = UserModel()
    user = um.get(credentials["id"])
    if (
        mode == "owner"
        and not user.admin
        and not (context.round.task.id, "owner")
        in [(perm.tid, perm.type) for perm in user.task_permissions]
    ):
        bottle.abort(403, "Access denied (you are not an admin or owner of this task)")

    vm = ValidationModel()
    validations = vm.getByEid(eid)
    label_counts = {"flagged": 0, "correct": 0, "incorrect": 0}
    for validation in validations:
        label_counts[validation.label.name] += 1
        if validation.uid == credentials["id"] and mode != "owner":
            bottle.abort(403, "Access denied (you have already validated this example)")
    label_counts[label] += 1

    if "metadata" in data:
        current_validation_metadata = data["metadata"]
    else:
        current_validation_metadata = {}

    if credentials["id"] == "turk":
        if not util.check_fields(data, ["uid"]):
            bottle.abort(400, "Missing data")
        example_metadata = json.loads(example.metadata_json)
        if (
            "annotator_id" not in example_metadata
            or example_metadata["annotator_id"] == data["uid"]
        ) and mode != "owner":
            bottle.abort(403, "Access denied (cannot validate your own example)")
        current_validation_metadata["annotator_id"] = data["uid"]
        for validation in validations:
            if (
                json.loads(validation.metadata_json)["annotator_id"]
                == current_validation_metadata["annotator_id"]
            ):
                bottle.abort(
                    403, "Access denied (you have already validated this example)"
                )
    elif credentials["id"] == example.uid and mode != "owner":
        bottle.abort(403, "Access denied (cannot validate your own example)")

    vm.create(credentials["id"], eid, label, mode, current_validation_metadata)

    em.update(example.id, {"total_verified": example.total_verified + 1})

    tm = TaskModel()
    task = tm.get(context.round.task.id)
    num_matching_validations = 3
    if task.settings_json:
        num_matching_validations = json.loads(task.settings_json)[
            "num_matching_validations"
        ]

    rm = RoundModel()
    rm.updateLastActivity(context.r_realid)

    if example.model_wrong:
        if label_counts["correct"] >= num_matching_validations or (
            mode == "owner" and label == "correct"
        ):
            rm.incrementVerifiedFooledCount(context.r_realid)
            um.incrementVerifiedFooledCount(example.uid)
        elif (
            label_counts["incorrect"] >= num_matching_validations
            or label_counts["flagged"] >= num_matching_validations
            or (mode == "owner" and label != "correct")
        ):
            um.incrementVerifiedNotFooledCount(example.uid)
            user = um.get(example.uid)
            metadata = json.loads(user.metadata_json)
            metadata[task.shortname + "_fooling_no_verified_incorrect_or_flagged"] -= 1
            user.metadata_json = json.dumps(metadata)
            um.dbs.commit()

    ret = example.to_dict()
    if credentials["id"] != "turk":
        user = um.updateValidatedCount(credentials["id"])

        bm = BadgeModel()
        badge_names = bm.handleValidateInterface(user, example)
        if badge_names:
            ret["badges"] = "|".join([badge_names])

    return util.json_encode(ret)
