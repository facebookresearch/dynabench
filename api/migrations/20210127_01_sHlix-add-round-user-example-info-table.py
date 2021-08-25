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


__depends__ = {
    "20210125_01_sksbT-add-starter-contexts-to-sentiment-r1-and-r3-and-hs-r4"
}


def apply_step(conn):

    engine_url = "mysql+pymysql://{}:{}@{}:3306/{}".format(
        config["db_user"], config["db_password"], config["db_host"], config["db_name"]
    )
    engine = db.create_engine(engine_url, pool_pre_ping=True, pool_recycle=3600)
    engine.connect()

    Session = scoped_session(sessionmaker())
    Session.configure(bind=engine)

    Base = automap_base()
    Base.prepare(engine, reflect=True)

    Examples = Base.classes.examples
    Rounds = Base.classes.rounds
    Validations = Base.classes.validations
    Contexts = Base.classes.contexts
    Tasks = Base.classes.tasks

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
    uid_and_r_realid_to_total_fooled = {}
    uid_and_r_realid_to_total_verified_nc_fooled = {}
    uid_and_r_realid_to_examples_submitted = {}
    for example in examples:
        if example.cid in cid_to_context and example.uid is not None:
            if (
                example.uid,
                cid_to_context[example.cid].r_realid,
            ) in uid_and_r_realid_to_examples_submitted:
                uid_and_r_realid_to_examples_submitted[
                    (example.uid, cid_to_context[example.cid].r_realid)
                ] += 1
            else:
                uid_and_r_realid_to_examples_submitted[
                    (example.uid, cid_to_context[example.cid].r_realid)
                ] = 1
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
                    if (
                        example.uid,
                        cid_to_context[example.cid].r_realid,
                    ) in uid_and_r_realid_to_total_verified_nc_fooled:
                        uid_and_r_realid_to_total_verified_nc_fooled[
                            (example.uid, cid_to_context[example.cid].r_realid)
                        ] += 1
                    else:
                        uid_and_r_realid_to_total_verified_nc_fooled[
                            (example.uid, cid_to_context[example.cid].r_realid)
                        ] = 1
            if example.model_wrong:
                if (
                    example.uid,
                    cid_to_context[example.cid].r_realid,
                ) in uid_and_r_realid_to_total_fooled:
                    uid_and_r_realid_to_total_fooled[
                        (example.uid, cid_to_context[example.cid].r_realid)
                    ] += 1
                else:
                    uid_and_r_realid_to_total_fooled[
                        (example.uid, cid_to_context[example.cid].r_realid)
                    ] = 1

    sql_values = []
    for (
        (uid, r_realid),
        examples_submitted,
    ) in uid_and_r_realid_to_examples_submitted.items():
        total_fooled = 0
        if (uid, r_realid) in uid_and_r_realid_to_total_fooled:
            total_fooled = uid_and_r_realid_to_total_fooled[(uid, r_realid)]
        total_verified_nc_fooled = 0
        if (uid, r_realid) in uid_and_r_realid_to_total_verified_nc_fooled:
            total_verified_nc_fooled = uid_and_r_realid_to_total_verified_nc_fooled[
                (uid, r_realid)
            ]
        sql_values.append(
            str(
                (
                    uid,
                    r_realid,
                    total_fooled,
                    total_verified_nc_fooled,
                    examples_submitted,
                )
            )
        )
    Session.close()
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS `round_user_example_info`")
    cursor.execute("/*!40101 SET @saved_cs_client     = @@character_set_client */")
    cursor.execute("/*!40101 SET character_set_client = utf8 */")
    cursor.execute(
        "CREATE TABLE `round_user_example_info` (`id` int(11) NOT NULL AUTO_INCREMENT,"
        + " `uid` int(11) NOT NULL, `r_realid` int(11) NOT NULL,"
        + " `total_fooled` int(11) DEFAULT '0',"
        + " `total_verified_not_correct_fooled` int(11) DEFAULT '0',"
        + " `examples_submitted` int(11) DEFAULT '0', PRIMARY KEY (`id`),"
        + " KEY `uid` (`uid`), KEY `r_realid` (`r_realid`),"
        + " CONSTRAINT `round_user_example_info_ibfk_1` FOREIGN KEY"
        + " (`uid`) REFERENCES `users` (`id`),"
        + " CONSTRAINT `round_user_example_info_ibfk_2` FOREIGN KEY"
        + " (`r_realid`) REFERENCES `rounds` (`id`))"
        + " ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4"
    )
    cursor.execute("/*!40101 SET character_set_client = @saved_cs_client */")
    cursor.execute("LOCK TABLES `round_user_example_info` WRITE")
    cursor.execute("/*!40000 ALTER TABLE `round_user_example_info` DISABLE KEYS */")
    cursor.execute(
        "INSERT INTO `round_user_example_info` (`uid`, `r_realid`,"
        + " `total_fooled`, `total_verified_not_correct_fooled`,"
        + " `examples_submitted`) VALUES "
        + ", ".join(sql_values)
    )
    cursor.execute("/*!40000 ALTER TABLE `round_user_example_info` ENABLE KEYS */")
    cursor.execute("UNLOCK TABLES")


def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS `round_user_example_info`")


steps = [step(apply_step, rollback_step)]
