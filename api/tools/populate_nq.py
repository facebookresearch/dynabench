# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import secrets
import sys

import pandas as pd

import common.ujson_mod as ujson
from models.context import Context
from models.round import Round, RoundModel
from models.task import TaskModel


sys.path.append("..")

fname = "contexts.tsv"

contexts = {"3": []}
for n in contexts.keys():
    fpath = os.path.join(fname)
    print(fpath)
    this_contexts = pd.read_csv(fpath, sep="\t")
    this_contexts2 = []
    for i, c in enumerate(this_contexts["context"]):
        split = this_contexts.loc[i, "ref"]
        title = this_contexts.loc[i, "title"]
        this_contexts2.append(
            {
                "context": c,
                "metadata_json": ujson.dumps(
                    {
                        "id": i,
                        "title": title,
                        "data_split": split,
                        "source": "nq_dpr_chunks",
                    }
                ),
            }
        )
    contexts[n] = this_contexts2

print({k: len(contexts[k]) for k in contexts.keys()})


tm = TaskModel()
task = tm.getByShortName("DK_QA")
rm = RoundModel()
rounds = [x.to_dict()["rid"] for x in rm.getByTid(task.id)]
print(rounds)

# Connect to the task model database session
dbs = tm.dbs

for rid in contexts.keys():
    if int(rid) not in rounds:
        round = Round(
            task=task, rid=int(rid), secret=secrets.token_hex(), url="https://TBD"
        )
        dbs.add(round)
        dbs.flush()
    else:
        round = rm.getByTidAndRid(task.id, int(rid))

    for context in contexts[rid]:
        print(task.id, rid, context, task, round)
        tags = "AQA|AQA" + rid
        c = Context(
            round=round,
            context=context["context"],
            metadata_json=context["metadata_json"],
        )
        print(c)
        dbs.add(c)
        dbs.flush()

dbs.commit()
