# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add Flores101
"""
import functools
import secrets

from yoyo import step


MODEL_URL = "https://TBD"


def insert_task(task: dict, conn):
    cursor = conn.cursor()
    cursor.execute(
        """
INSERT INTO `tasks` (
    name, shortname, task_code, `desc`,
    targets, cur_round, last_updated, has_context, hidden, type
) VALUES (
    %(name)s, %(shortname)s, %(task_code)s, %(desc)s,
    'na',    1,         NOW(),        0,           0, 'seqseq'
)
""",
        task,
    )


def delete_task(task: dict, conn):
    conn.execute("DELETE FROM `tasks` WHERE shortname=%(shortname)s", task)


def get_task_id(shortname: str, cursor):
    n_tasks = cursor.execute("SELECT * FROM tasks WHERE shortname=%s", (shortname,))
    assert n_tasks == 1
    results = cursor.fetchall()
    assert len(results) == 1
    tid = results[0][0]
    return tid


def insert_round(task: dict, conn):
    cursor = conn.cursor()
    task_id = get_task_id(task["shortname"], cursor)
    cursor.execute(
        "INSERT INTO `rounds` (tid, rid, secret, url) VALUES (%s, 1, %s, %s)",
        (task_id, secrets.token_hex(), MODEL_URL),
    )


def delete_round(task: dict, conn):
    cursor = conn.cursor()
    task_id = get_task_id(task["shortname"], cursor)
    cursor.execute("DELETE FROM `rounds` WHERE tid=%s AND url=%s", (task_id, MODEL_URL))
    cursor.execute("DELETE FROM `rounds` WHERE tid=%s AND url=%s", (task_id, MODEL_URL))


tasks = [
    {
        "name": "Flores MT Evaluation (Small task 1)",
        "shortname": "FLORES-SMALL1",
        "desc": """Machine Translation Evaluation for Central/East European languages:
Croatian, Hungarian, Estonian, Serbian, Macedonian, English""",
        "task_code": "flores-small1",
    },
    {
        "name": "Flores MT Evaluation (Small task 2)",
        "shortname": "FLORES-SMALL2",
        "desc": """Machine Translation Evaluation East Asian languages:
Sundanese, Javanese, Indonesian, Malay, Tagalog, Tamil, English""",
        "task_code": "flores-small2",
    },
    {
        "name": "Flores MT Evaluation (FULL)",
        "shortname": "FLORES-FULL",
        "desc": "Machine Translation Evaluation for 100+ Languages",
        "task_code": "flores-full",
    },
]

steps = []

for task in tasks:
    steps.append(
        step(functools.partial(insert_task, task), functools.partial(delete_task, task))
    )
    steps.append(
        step(
            functools.partial(insert_round, task), functools.partial(delete_round, task)
        )
    )
