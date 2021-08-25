# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets
import sys

import sqlalchemy as db

from models.base import DBSession as dbs
from models.round import Round
from models.task import Task


sys.path.append("..")

tasks = [
    {
        "name": "Yixin",
        "shortname": "YN",
        "desc": "Yixin",
        "targets": "na",
        "has_context": False,
        "hidden": True,
        "type": "clf",
    }
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
        hidden=task["hidden"],
        type=task["type"],
    )
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url="https://TBD")
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
