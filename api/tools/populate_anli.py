import json
import sys
import os
import secrets
import codecs

if not os.path.exists('anli_v0.1.zip'):
    os.system('wget https://dl.fbaipublicfiles.com/anli/anli_v0.1.zip')
if not os.path.exists('anli_v0.1'):
    os.system('unzip anli_v0.1.zip')
contexts = {'1': [], '2': [], '3': []}
for n in contexts.keys():
    for fname in os.listdir(os.path.join('anli_v0.1', 'R'+n)):
        if not fname.endswith('.jsonl'):
            continue
        fpath = os.path.join('anli_v0.1', 'R'+n, fname)
        print(fpath)
        contexts[n].extend([json.loads(l)['context'] for l in codecs.open(fpath, 'r', 'utf8')])
    contexts[n] = list(set(contexts[n]))
print({k:len(contexts[k]) for k in contexts.keys()})

sys.path.append('..')
from models.base import dbs
from models.context import ContextModel, Context
from models.task import TaskModel, Task
from models.round import RoundModel, Round

tm = TaskModel()
task = tm.getByShortName('NLI')
rm = RoundModel()
rounds = [x.to_dict()['rid'] for x in rm.getByTid(task.id)]
print(rounds)

for rid in contexts.keys():
    if rid not in rounds:
        round = Round(task=task, rid=int(rid), secret=secrets.token_hex(), url='https://TBD')
        dbs.add(round)
        dbs.flush()
    else:
        round = rm.getByTidAndRid(task.id, int(rid))
    for context in contexts[rid]:
        print(task.id, rid, context, task, round)
        tags = 'ANLI|ANLI'+rid
        c = Context(task=task, round=round, context=context, tags=tags)
        print(c)
        dbs.add(c)
        dbs.flush()

dbs.commit()
