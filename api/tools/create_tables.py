# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys

import sqlalchemy as db
from sqlalchemy.orm import sessionmaker

from common.config import config
from models.badge import Badge
from models.base import Base
from models.notification import Notification


# insert models here:
# from models.task import Task
# t = Task()
# from models.round import Round
# r = Round()
# from models.score import Score
# s = Score()
# from models.model import Model
# m = Model()
# from models.context import Context
# c = Context()
# from models.example import Example
# e = Example()
# from models.user import User
# u = User()


sys.path.append("..")
# Base = declarative_base()

# now this is very ugly..
engine = db.create_engine(
    "mysql+pymysql://{}:{}@localhost:3306/{}".format(
        config["db_user"], config["db_password"], config["db_name"]
    ),
    echo="debug",
    echo_pool=True,
)
connection = engine.connect()
Base.metadata.bind = engine
sesh = sessionmaker(bind=engine)
dbs = sesh()

n = Notification()
b = Badge()
Base.metadata.create_all(engine)
dbs.commit()
