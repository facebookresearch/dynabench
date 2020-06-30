import sqlalchemy as db
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import sys
sys.path.append('..')
from models.base import DBSession as dbs
from models.task import Task
from models.round import Round
import secrets

tasks = [ \
        {'name': 'Divyansh Natural Language Inference', 'shortname': 'DK_NLI', 'desc': 'Natural Language Inference is classifying context-hypothesis pairs into whether they entail, contradict or are neutral.', 'targets': 'entailing|neutral|contradictory', 'has_context': True, 'hidden':True, 'type': 'clf'}, \
        {'name': 'Divyansh Question Answering', 'shortname': 'DK_QA', 'desc': 'Question answering and machine reading comprehension is answering a question given a context.', 'targets': 'na', 'has_context': True, 'hidden':True, 'type': 'extract'}, \
        ]

for task in tasks:
    t = Task(name=task['name'], shortname=task['shortname'], desc=task['desc'], cur_round=1, last_updated=db.sql.func.now(), targets=task['targets'], has_context=task['has_context'], hidden=task['hidden'], type=task['type'])
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url='https://TBD')
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()