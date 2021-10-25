# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys

import pandas as pd

import common.helpers as util
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
        {"context": sent, "metadata_json": util.json_encode({"review_id": review_id})}
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
