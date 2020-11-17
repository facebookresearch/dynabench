# Copyright (c) Facebook, Inc. and its affiliates.

import json

from yoyo import step

from models.example import Example, ExampleModel
from models.round import Round, RoundModel
from models.user import User, UserModel
from models.validation import Validation, ValidationModel


def apply_step(conn):
    cursor = conn.cursor()

    cursor.execute("ALTER TABLE rounds DROP total_verified_fooled")
    cursor.execute("ALTER TABLE rounds ADD total_verified_fooled int default 0")
    cursor.execute("ALTER TABLE users ADD total_verified_not_fooled int default 0")

    vm = ValidationModel()
    validations = vm.dbs.query(Validation)
    eid_to_validations = {}
    for validation in validations:
        if validation.eid in eid_to_validations:
            eid_to_validations[validation.eid].append(validation)
        else:
            eid_to_validations[validation.eid] = [validation]

    em = ExampleModel()
    examples = em.dbs.query(Example)
    uid_to_total_verified_fooled = {}
    uid_to_total_verified_not_fooled = {}
    rid_to_total_verified_fooled = {}
    for example in examples:
        if example.id in eid_to_validations:
            task = example.context.round.task
            num_matching_validations = 3

            if task.settings_json:
                settings = json.loads(task.settings_json)
                if "num_matching_validations" in settings:
                    num_matching_validations = settings["num_matching_validations"]

            if (
                len(
                    list(
                        filter(
                            lambda validation: validation.label.name == "flagged"
                            or validation.label.name == "incorrect",
                            eid_to_validations[example.id],
                        )
                    )
                )
                > num_matching_validations
                or len(
                    list(
                        filter(
                            lambda validation: (
                                validation.label.name == "flagged"
                                or validation.label.name == "incorrect"
                            )
                            and validation.mode.name == "owner",
                            eid_to_validations[example.id],
                        )
                    )
                )
                >= 1
            ):
                if example.uid in uid_to_total_verified_not_fooled:
                    uid_to_total_verified_not_fooled[example.uid] += 1
                else:
                    uid_to_total_verified_not_fooled[example.uid] = 1
            if (
                len(
                    list(
                        filter(
                            lambda validation: validation.label.name == "correct",
                            eid_to_validations[example.id],
                        )
                    )
                )
                > num_matching_validations
                or len(
                    list(
                        filter(
                            lambda validation: (validation.label.name == "correct")
                            and validation.mode.name == "owner",
                            eid_to_validations[example.id],
                        )
                    )
                )
                >= 1
            ):

                if example.uid in uid_to_total_verified_fooled:
                    uid_to_total_verified_fooled[example.uid] += 1
                else:
                    uid_to_total_verified_fooled[example.uid] = 1

                if example.context.r_realid in rid_to_total_verified_fooled:
                    rid_to_total_verified_fooled[example.context.r_realid] += 1
                else:
                    rid_to_total_verified_fooled[example.context.r_realid] = 1

    um = UserModel()
    users = um.dbs.query(User)
    for user in users:
        if user.id in uid_to_total_verified_fooled:
            user.total_verified_fooled = uid_to_total_verified_fooled[user.id]
        if user.id in uid_to_total_verified_not_fooled:
            user.total_verified_not_fooled = uid_to_total_verified_not_fooled[user.id]

    rm = RoundModel()
    rounds = rm.dbs.query(Round)
    for round in rounds:
        if round.id in rid_to_total_verified_fooled:
            round.total_verified_fooled = rid_to_total_verified_fooled[round.id]

    um.dbs.commit()


def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users DROP total_verified_not_fooled")


steps = [step(apply_step, rollback_step)]
