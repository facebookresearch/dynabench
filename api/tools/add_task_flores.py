# Copyright (c) Facebook, Inc. and its affiliates.

import secrets
import sys

import sqlalchemy as db

from models.base import DBSession as dbs
from models.round import Round
from models.task import Task


sys.path.append("..")  # noqa


tasks = [
    {
        "name": "Flores MT Evaluation (Small task 1",
        "shortname": "FLORES-SMALL1",
        "desc": (
            "Machine Translation Evaluation for Central/East European languages:"
            "\n"
            "Croatian, Hungarian, Estonian, Serbian, Macedonian, English"
        ),
        "targets": "na",
        "has_context": False,
        "type": "seqseq",
        "task_code": "flores-small1",
    },
    {
        "name": "Flores MT Evaluation (Small task 2)",
        "shortname": "FLORES-SMALL2",
        "desc": (
            "Machine Translation Evaluation East Asian languages:"
            "\n"
            "Sundanese, Javanese, Indonesian, Malay, Tagalog, Tamil, English"
        ),
        "targets": "na",
        "has_context": False,
        "type": "seqseq",
        "task_code": "flores-small2",
    },
    {
        "name": "Flores MT Evaluation (FULL)",
        "shortname": "FLORES-FULL",
        "desc": ("Machine Translation Evaluation for 100+ Languages "),
        "targets": "na",
        "has_context": False,
        "type": "seqseq",
        "task_code": "flores-full",
    },
]

for task in tasks:
    t = Task(
        name=task["name"],
        shortname=task["shortname"],
        desc=task["desc"],
        cur_round=1,
        last_updated=db.sql.func.now(),
        targets=task["targets"],
        has_context=task["has_context"],
        type=task["type"],
        task_code=task["task_code"],
    )
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url="https://TBD")
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
