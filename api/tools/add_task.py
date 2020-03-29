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
        {'name': 'Natural Language Inference', 'shortname': 'NLI', 'desc': 'Natural Language Inference is classifying context-hypothesis pairs into whether they entail, contradict or are neutral.', 'targets': 'entailing|neutral|contradictory', 'has_context': True}, \
        {'name': 'Question Answering', 'shortname': 'QA', 'desc': 'Question answering and machine reading comprehension is answering a question given a context.', 'targets': 'na', 'has_context': True}, \
        {'name': 'Sentiment Analysis', 'shortname': 'Sentiment', 'desc': 'Sentiment analysis is classifying one or more sentences by their positive/negative sentiment.', 'targets': 'positive|negative', 'has_context': False}, \
        {'name': 'Natural Language and Visual Reasoning', 'shortname': 'NLVR', 'desc': 'Natural language and visual reasoning is deciding if an image and text belong together or not.', 'targets': 'entailing|non-entailing', 'has_context': True}, \
        {'name': 'Hate Speech', 'shortname': 'Hate Speech', 'desc': 'Hate speech detection is classifying one or more sentences by whether or not they are hateful.', 'targets': 'hateful|not-hateful', 'has_context': False} \
        ]

for task in tasks:
    t = Task(name=task['name'], shortname=task['shortname'], desc=task['desc'], cur_round=1, last_updated=db.sql.func.now(), targets=task['targets'], has_context=task['has_context'])
    dbs.add(t)
    dbs.flush()
    r = Round(task=t, rid=1, secret=secrets.token_hex(), url='https://TBD')
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
