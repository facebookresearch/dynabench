#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import importlib
import os

import sqlalchemy as db
from werkzeug.security import generate_password_hash

import ujson


def get_cls_name_helper(ss):
    ret, ii = "", 0
    while ii < len(ss):
        if ii == 0:
            ret += ss[ii].upper()
        elif ss[ii] == "_":
            ret += ss[ii + 1].upper()
            ii += 1
        else:
            ret += ss[ii]
        ii += 1
    return ret


if __name__ == "__main__":

    ##
    # Create a config.py if it doesn't exist
    ##
    if not os.path.exists("common/config.py"):
        print("Config does not exist yet, let's create it.")
        print("NOTE: Use absolute paths where applicable!")

        example_config_str = open("common/config.py.example").read()
        config = {}
        exec(example_config_str)

        required_fields = [
            "db_name",
            "db_user",
            "db_password",
            "ssl_cert_file_path",
            "ssl_org_pem_file_path",
        ]
        for field in required_fields:
            tmp = input(f"Please enter your {field}: ")
            config[field] = tmp

        with open("common/config.py", "w") as fw:
            fw.write("config = " + ujson.dumps(config, indent=4, sort_keys=True, escape_forward_slashes=False))
            print("Wrote config to common/config.py - feel free to edit.")
    else:
        print("Config already exists.")
        from common.config import config

    from models.base import Base

    ##
    # Mark all existing migrations done
    ##
    from common.migrator import first_time_migrations

    first_time_migrations()

    ##
    # Create all tables
    ##
    engine = db.create_engine(
        "mysql+pymysql://{}:{}@localhost:3306/{}".format(
            config["db_user"], config["db_password"], config["db_name"]
        ),
        # in case you want to debug:
        # echo="debug",
        # echo_pool=True,
    )
    connection = engine.connect()
    Base.metadata.bind = engine
    mods = {}
    for m in os.listdir("models/"):
        if m.endswith(".py") and not m.startswith("__"):
            name = m[:-3]
            mod = importlib.import_module("models." + name)
            cls = get_cls_name_helper(name)
            constructor = getattr(mod, cls)
            mods[cls] = constructor()

    Base.metadata.create_all(engine)

    ##
    # Create one admin user and one task with one round
    ##
    from models.base import DBSession as dbs
    from models.user import User
    from models.task import Task
    from models.task_user_permission import TaskUserPermission
    from models.round import Round
    import getpass

    dbs.flush()
    u = User(
        admin=True,
        username=input("Enter admin username: "),
        email=input("Enter admin email: "),
        password=generate_password_hash(
            getpass.getpass(prompt="Enter admin password (remains hidden): ")
        ),
    )
    dbs.add(u)
    dbs.flush()
    t = Task(
        name="Test",
        task_code="test",
        desc="Your test task",
        annotation_config_json=ujson.dumps({}),
        cur_round=1,
    )
    dbs.add(t)
    dbs.flush()
    tup = TaskUserPermission(user=u, task=t, type="owner")
    dbs.add(tup)
    dbs.flush()
    r = Round(task=t, rid=1, desc="Your test round", secret="TBD", url="https://TBD")
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
    dbs.close()
