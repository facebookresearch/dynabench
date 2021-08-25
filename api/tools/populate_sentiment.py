# Copyright (c) Facebook, Inc. and its affiliates.

import json
import sys

import pandas as pd

from models.context import Context
from models.round import RoundModel
from models.task import TaskModel


sys.path.append("..")


fname = "sentiment-contexts.csv"
rid = 1

contexts = pd.read_csv(fname)
data = []
for review_id, sent in zip(contexts["review_id"], contexts["sentence"]):
    print(review_id, sent)
    data.append(
        {"context": sent, "metadata_json": json.dumps({"review_id": review_id})}
    )

tm = TaskModel()
rm = RoundModel()

dbs = tm.dbs

task = tm.getByShortName("Sentiment")
round = rm.getByTidAndRid(task.id, rid)

for context in data:
    print(task.id, rid, context)
    c = Context(
        round=round, context=context["context"], metadata_json=context["metadata_json"]
    )
    print(c)
    dbs.add(c)
    dbs.flush()

dbs.commit()
