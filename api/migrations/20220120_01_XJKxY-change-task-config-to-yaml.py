# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
"""
Change task config from json to yaml
"""
import json
import sys

import sqlalchemy as db
import yaml
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import scoped_session, sessionmaker
from yoyo import step


sys.path.append(".")
from common.config import config  # noqa isort:skip

__depends__ = {"20220119_01_WOGoS-add-log-access-type"}


def apply_step(conn):
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE tasks CHANGE annotation_config_json config_yaml TEXT")

    engine_url = "mysql+pymysql://{}:{}@{}:3306/{}".format(
        config["db_user"], config["db_password"], config["db_host"], config["db_name"]
    )
    engine = db.create_engine(engine_url, pool_pre_ping=True, pool_recycle=3600)
    engine.connect()

    Session = scoped_session(sessionmaker())
    Session.configure(bind=engine)

    Base = automap_base()
    Base.prepare(engine, reflect=True)

    Tasks = Base.classes.tasks

    tasks = Session.query(Tasks)

    for task in tasks:
        if task.config_yaml is not None:
            config_dict = json.loads(task.config_yaml)

            # We want to flatten some hierarchies and simplify the file overall.
            # Because of this, it is also difficult to implement a rollback step.
            simplified_config_dict = {}
            for key, value in config_dict.items():
                if key != "metadata":
                    if isinstance(value, list):
                        if value != []:
                            simplified_config_dict[key] = []
                            for obj in value:
                                if key == "output" and obj["name"] in [
                                    o["name"]
                                    for o in config_dict["input"]
                                    + config_dict["context"]
                                ]:
                                    simplified_config_dict[key].append(
                                        {"name": obj["name"]}
                                    )
                                else:
                                    if "constructor_args" in obj:
                                        newobj = obj
                                        for key2, value2 in obj[
                                            "constructor_args"
                                        ].items():
                                            newobj[key2] = value2
                                        del newobj["constructor_args"]
                                    simplified_config_dict[key].append(newobj)
                    elif isinstance(value, dict):
                        if value != {}:
                            if "constructor_args" in value:
                                newvalue = value
                                for key2, value2 in value["constructor_args"].items():
                                    newvalue[key2] = value2
                                del newvalue["constructor_args"]
                            simplified_config_dict[key] = value
                    else:
                        simplified_config_dict[key] = value

            for key, value in config_dict["metadata"].items():
                if value != []:
                    if "metadata" not in simplified_config_dict:
                        simplified_config_dict["metadata"] = {}
                    simplified_config_dict["metadata"][key] = []
                    for obj in value:
                        if "constructor_args" in obj:
                            newobj = obj
                            for key2, value2 in obj["constructor_args"].items():
                                newobj[key2] = value2
                            del newobj["constructor_args"]
                        simplified_config_dict["metadata"][key].append(newobj)

            task.config_yaml = yaml.dump(simplified_config_dict)

    Session.commit()


steps = [step(apply_step)]
