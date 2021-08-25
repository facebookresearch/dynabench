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
        "name": "Natural Language Inference",
        "shortname": "NLI",
        "desc": (
            "Natural Language Inference is classifying context-hypothesis pairs "
            + "into whether they entail, contradict or are neutral."
        ),
        "targets": "entailed|neutral|contradictory",
        "has_context": True,
        "type": "clf",
        "has_answer": False,
    },
    {
        "name": "Question Answering",
        "shortname": "QA",
        "desc": (
            "Question answering and machine reading comprehension is answering a "
            + "question given a context."
        ),
        "targets": "na",
        "has_context": True,
        "type": "extract",
        "has_answer": True,
    },
    {
        "name": "Sentiment Analysis",
        "shortname": "Sentiment",
        "desc": (
            "Sentiment analysis is classifying one or more sentences by their "
            + "positive/negative sentiment."
        ),
        "targets": "positive|negative",
        "has_context": False,
        "type": "clf",
        "has_answer": False,
    },
    {
        "name": "Hate Speech",
        "shortname": "Hate Speech",
        "desc": (
            "Hate speech detection is classifying one or more sentences by"
            + " whether or not they are hateful."
        ),
        "targets": "hateful|not-hateful",
        "has_context": False,
        "type": "clf",
        "has_answer": False,
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
    )
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url="https://TBD")
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
