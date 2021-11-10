# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle

import common.auth as _auth
import common.helpers as util
from models.badge import BadgeModel
from models.context import ContextModel
from models.example import ExampleModel
from models.round import RoundModel
from models.round_user_example_info import RoundUserExampleInfoModel
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
        if validation.label.name in label_counts:
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
        example_metadata = util.json_decode(example.metadata_json)
        if (
            "annotator_id" not in example_metadata
            or example_metadata["annotator_id"] == data["uid"]
        ) and mode != "owner":
            bottle.abort(403, "Access denied (cannot validate your own example)")
        current_validation_metadata["annotator_id"] = data["uid"]
        for validation in validations:
            if (
                util.json_decode(validation.metadata_json)["annotator_id"]
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

    if task.unique_validators_for_example_tags:
        for other_example in em.getByTid(task.id):
            if (
                other_example.id != example.id
                and other_example.tag is not None
                and other_example.tag == example.tag
            ):
                vm.create(
                    credentials["id"],
                    other_example.id,
                    "placeholder",
                    mode,
                    current_validation_metadata,
                )

    rm = RoundModel()
    rm.updateLastActivity(context.r_realid)

    if example.model_wrong:
        user = um.get(example.uid)
        if user:
            if label_counts["correct"] >= task.num_matching_validations or (
                mode == "owner" and label == "correct"
            ):
                rm.incrementVerifiedFooledCount(context.r_realid)
                um.incrementVerifiedFooledCount(example.uid)
            elif (
                label_counts["incorrect"] >= task.num_matching_validations
                or label_counts["flagged"] >= task.num_matching_validations
                or (mode == "owner" and label != "correct")
            ):

                um.incrementVerifiedNotCorrectFooledCount(example.uid)
                if credentials["id"] != "turk":
                    info = RoundUserExampleInfoModel()
                    info.incrementVerifiedNotCorrectFooledCount(
                        example.uid, context.r_realid
                    )
                if user.metadata_json is not None:
                    user_metadata = util.json_decode(user.metadata_json)
                    if (
                        task.task_code + "_fooling_no_verified_incorrect_or_flagged"
                        in user_metadata
                    ):
                        user_metadata[
                            task.task_code + "_fooling_no_verified_incorrect_or_flagged"
                        ] -= 1
                    else:
                        # Start recording this field now
                        user_metadata[
                            task.task_code + "_fooling_no_verified_incorrect_or_flagged"
                        ] = 0
                else:
                    # Start recording this field now
                    user_metadata = {
                        task.task_code + "_fooling_no_verified_incorrect_or_flagged": 0
                    }
                user.metadata_json = util.json_encode(user_metadata)
                um.dbs.commit()

    ret = example.to_dict()
    if credentials["id"] != "turk":
        user = um.updateValidatedCount(credentials["id"])

        bm = BadgeModel()
        badge_names = bm.handleValidateInterface(user, example)
        ret["badges"] = "|".join(badge_names)

    return util.json_encode(ret)
