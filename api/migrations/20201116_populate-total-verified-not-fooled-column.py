# Copyright (c) Facebook, Inc. and its affiliates.

from yoyo import step

from models.task import Task, TaskModel
from models.user import User, UserModel


def apply_step(conn):
    cursor = conn.cursor()

    cursor.execute("ALTER TABLE users ADD total_verified_not_fooled int default 0")

    tm = TaskModel()
    tasks = tm.dbs.query(Task)
    for task in tasks:
        cursor.execute(
            "UPDATE tasks SET settings_json = '{\"num_matching_validations\": 3}' "
            + "where (id = "
            + task.id
            + " and settings_json is NULL)"
        )

    um = UserModel()
    users = um.dbs.query(User)
    for user in users:
        # Correct total_verified_not_fooled
        cursor.execute(
            "UPDATE users SET total_verified_not_fooled = (SELECT COUNT(*) FROM "
            + "examples e WHERE ((e.model_wrong = True) and ((SELECT COUNT(*) "
            + 'FROM validations v where v.eid = e.id and (v.label = "incorrect" '
            + 'or v.label = "flagged")) > (select json_extract((select settings_json '
            + "from tasks t where t.id = (select tid from rounds r where r.id = "
            + "(SELECT r_realid from contexts c where c.id = e.cid))), "
            + '"$.num_matching_validations"))) and (e.uid = '
            + str(user.id)
            + "))) where id = "
            + str(user.id)
        )

        # Correct total_verfied_fooled
        cursor.execute(
            "UPDATE users SET total_verified_fooled = (SELECT COUNT(*) FROM "
            + "examples e WHERE ((e.model_wrong = True) and ((SELECT COUNT(*) "
            + 'FROM validations v where v.eid = e.id and (v.label = "correct")) '
            + "> (select json_extract((select settings_json "
            + "from tasks t where t.id = (select tid from rounds r where r.id = "
            + "(SELECT r_realid from contexts c where c.id = e.cid))), "
            + '"$.num_matching_validations"))) and (e.uid = '
            + str(user.id)
            + "))) where id = "
            + str(user.id)
        )


def rollback_step(conn):
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users DROP total_verified_not_fooled")


steps = [step(apply_step, rollback_step)]
