import sqlalchemy as db
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import sys
sys.path.append('..')
from models.base import dbs
from models.task import Task
from models.round import Round
import secrets

tasks = [ \
        {'name': 'Natural Language Inference', 'shortname': 'NLI', 'desc': 'Natural Language Inference is classifying context-hypothesis pairs into whether they entail, contradict or are neutral.', 'targets': 'entailing|neutral|contradictory', 'has_context': True, 'hidden':True}, \
        {'name': 'Question Answering', 'shortname': 'QA', 'desc': 'Question answering and machine reading comprehension is answering a question given a context.', 'targets': 'na', 'has_context': True, 'hidden':True}, \
        ]

for task in tasks:
    t = Task(name=task['name'], shortname=task['shortname'], desc=task['desc'], cur_round=1, last_updated=db.sql.func.now(), targets=task['targets'], has_context=task['has_context'], hidden=task['hidden'])
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url='https://TBD')
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()