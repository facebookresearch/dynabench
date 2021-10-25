# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets
import sys

import ujson
from models.base import dbs
from models.context import Context
from models.round import Round, RoundModel
from models.task import TaskModel


path_of_r4_context = "./HotPotQATrain_505_A4.jsonl"


def load_jsonl(filename, debug_num=None):
    d_list = []
    with open(filename, encoding="utf-8", mode="r") as in_f:
        print("Load Jsonl:", filename)
        for line in in_f:
            item = ujson.loads(line.strip())
            d_list.append(item)
            if debug_num is not None and 0 < debug_num == len(d_list):
                break

    return d_list


contexts = {"4": []}
r4_list = load_jsonl(path_of_r4_context)
for item in r4_list:
    contexts["4"].append(item["Context"])

print({k: len(contexts[k]) for k in contexts.keys()})

sys.path.append("..")

tm = TaskModel()
task = tm.getByShortName("NLI")
rm = RoundModel()
rounds = [x.to_dict()["rid"] for x in rm.getByTid(task.id)]
print(rounds)

for rid in contexts.keys():
    if rid not in rounds:
        round = Round(
            task=task, rid=int(rid), secret=secrets.token_hex(), url="https://TBD"
        )
        dbs.add(round)
        dbs.flush()
    else:
        round = rm.getByTidAndRid(task.id, int(rid))
    for context in contexts[rid]:
        print(task.id, rid, context, task, round)
        tags = "ANLI|ANLI" + rid
        c = Context(round=round, context=context, tags=tags)
        print(c)
        dbs.add(c)
        dbs.flush()

dbs.commit()
