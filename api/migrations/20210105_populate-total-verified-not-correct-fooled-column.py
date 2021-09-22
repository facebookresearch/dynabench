# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import sys

import sqlalchemy as db
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import scoped_session, sessionmaker
from yoyo import step


sys.path.append(".")
from common.config import config  # noqa isort:skip


__depends__ = {"20201116_populate-total-verified-not-fooled-column"}


def apply_step(conn):
    cursor = conn.cursor()

    cursor.execute("ALTER TABLE users DROP total_verified_not_fooled")
    cursor.execute(
        "ALTER TABLE users ADD total_verified_not_correct_fooled int default 0"
    )

    engine_url = "mysql+pymysql://{}:{}@{}:3306/{}".format(
        config["db_user"], config["db_password"], config["db_host"], config["db_name"]
    )
    engine = db.create_engine(engine_url, pool_pre_ping=True, pool_recycle=3600)
    engine.connect()

    Session = scoped_session(sessionmaker())
    Session.configure(bind=engine)

    Base = automap_base()
    Base.prepare(engine, reflect=True)

    Users = Base.classes.users
    Examples = Base.classes.examples
    Rounds = Base.classes.rounds
    Validations = Base.classes.validations
    Contexts = Base.classes.contexts
    Tasks = Base.classes.tasks

    users = Session.query(Users)
    examples = Session.query(Examples)
    rounds = Session.query(Rounds)
    validations = Session.query(Validations)
    contexts = Session.query(Contexts)
    tasks = Session.query(Tasks)

    eid_to_validations = {}
    for validation in validations:
        if validation.eid in eid_to_validations:
            eid_to_validations[validation.eid].append(validation)
        else:
            eid_to_validations[validation.eid] = [validation]
    tid_to_task = {}
    for task in tasks:
        tid_to_task[task.id] = task
    r_realid_to_task = {}
    for round in rounds:
        if round.tid in tid_to_task:
            r_realid_to_task[round.id] = tid_to_task[round.tid]
    cid_to_task = {}
    cid_to_context = {}
    for context in contexts:
        if context.r_realid in r_realid_to_task:
            cid_to_task[context.id] = r_realid_to_task[context.r_realid]
        cid_to_context[context.id] = context
    eid_to_task = {}
    for example in examples:
        if example.cid in cid_to_task:
            eid_to_task[example.id] = cid_to_task[example.cid]
    uid_to_total_verified_fooled = {}
    uid_to_total_verified_nc_fooled = {}
    rid_to_total_verified_fooled = {}
    for example in examples:
        if example.id in eid_to_validations:
            task = eid_to_task[example.id]
            num_matching_validations = 3

            if task.settings_json:
                settings = json.loads(task.settings_json)
                if "num_matching_validations" in settings:
                    num_matching_validations = settings["num_matching_validations"]

            if example.model_wrong and (
                len(
                    list(
                        filter(
                            lambda validation: validation.label == "flagged"
                            or validation.label == "incorrect",
                            eid_to_validations[example.id],
                        )
                    )
                )
                > num_matching_validations
                or len(
                    list(
                        filter(
                            lambda validation: (
                                validation.label == "flagged"
                                or validation.label == "incorrect"
                            )
                            and validation.mode == "owner",
                            eid_to_validations[example.id],
                        )
                    )
                )
                >= 1
                or example.retracted
            ):
                if example.uid in uid_to_total_verified_nc_fooled:
                    uid_to_total_verified_nc_fooled[example.uid] += 1
                else:
                    uid_to_total_verified_nc_fooled[example.uid] = 1
            if example.model_wrong and (
                len(
                    list(
                        filter(
                            lambda validation: validation.label == "correct",
                            eid_to_validations[example.id],
                        )
                    )
                )
                > num_matching_validations
                or len(
                    list(
                        filter(
                            lambda validation: (validation.label == "correct")
                            and validation.mode == "owner",
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

                if cid_to_context[example.cid].r_realid in rid_to_total_verified_fooled:
                    rid_to_total_verified_fooled[
                        cid_to_context[example.cid].r_realid
                    ] += 1
                else:
                    rid_to_total_verified_fooled[
                        cid_to_context[example.cid].r_realid
                    ] = 1

    for user in users:
        if user.id in uid_to_total_verified_fooled:
            user.total_verified_fooled = uid_to_total_verified_fooled[user.id]
        if user.id in uid_to_total_verified_nc_fooled:
            user.total_verified_not_correct_fooled = uid_to_total_verified_nc_fooled[
                user.id
            ]

    for round in rounds:
        if round.id in rid_to_total_verified_fooled:
            round.total_verified_fooled = rid_to_total_verified_fooled[round.id]

    Session.commit()


def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users ADD total_verified_not_fooled int(11)")
    cursor.execute("ALTER TABLE users DROP total_verified_not_correct_fooled")


steps = [step(apply_step, rollback_step)]
