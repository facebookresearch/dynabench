# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import scoped_session, sessionmaker

from common.config import config


Base = declarative_base()

# now this is very ugly..


def connect_db():
    engine_url = "mysql+pymysql://{}:{}@{}:3306/{}".format(
        config["db_user"], config["db_password"], config["db_host"], config["db_name"]
    )
    engine = db.create_engine(engine_url, pool_pre_ping=True, pool_recycle=3600)
    engine.connect()
    Base.metadata.bind = engine
    Session = scoped_session(sessionmaker())
    return Session
    # DBSession = sessionmaker(bind=engine)
    # return DBSession()


DBSession = connect_db()


class BaseModel:
    def __init__(self, model):
        self.model = model
        # self.dbs = dbs #connect_db()
        self.dbs = DBSession()

    def __del__(self):
        self.dbs.close()

    def get(self, id):
        try:
            return self.dbs.query(self.model).filter(self.model.id == id).one()
        except db.orm.exc.NoResultFound:
            return False

    def list(self):
        rows = self.dbs.query(self.model).all()
        return [r.to_dict() for r in rows]

    def update(self, id, kwargs):
        t = self.dbs.query(self.model).filter(self.model.id == id)
        t.update(kwargs)
        self.dbs.commit()
