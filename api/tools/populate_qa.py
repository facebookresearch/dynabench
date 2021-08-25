# Copyright (c) Facebook, Inc. and its affiliates.

import codecs
import json
import os
import secrets
import sys

from models.context import Context
from models.round import Round, RoundModel
from models.task import TaskModel


fname = "20200701-1806-harderqs-passages.jsonl"
if not os.path.exists(fname):
    os.system(f"wget http://cdn.cybermaxcreations.com/qa/{fname}")

contexts = {"1": [], "2": []}
for n in contexts.keys():
    fpath = os.path.join(fname)
    print(fpath)
    this_contexts = [json.loads(ll) for ll in codecs.open(fpath, "r", "utf8")]
    this_contexts = [
        {
            "context": c["passage"],
            "metadata_json": json.dumps(
                {
                    "id": c["id"],
                    "title": c["title"],
                    "data_split": c["ref"],
                    "source": "squad_v1.1",
                }
            ),
        }
        for c in this_contexts
    ]
    contexts[n] = this_contexts

print({k: len(contexts[k]) for k in contexts.keys()})

sys.path.append("..")


tm = TaskModel()
task = tm.getByShortName("QA")
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
        )  # , tags=tags)  # Seems like tags have been removed from the db
        print(c)
        dbs.add(c)
        dbs.flush()

dbs.commit()
