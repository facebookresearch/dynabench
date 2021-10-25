# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import enum
import sqlalchemy as db

import common.ujson_mod as ujson
from common.logging import logger

from .base import Base, BaseModel


class LabelEnum(enum.Enum):
    flagged = "flagged"
    correct = "correct"
    incorrect = "incorrect"


class ModeEnum(enum.Enum):
    user = "user"
    owner = "owner"


class Validation(Base):
    __tablename__ = "validations"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    eid = db.Column(db.Integer, db.ForeignKey("examples.id"), nullable=False)
    label = db.Column(db.Enum(LabelEnum))
    mode = db.Column(db.Enum(ModeEnum))
    metadata_json = db.Column(db.Text)

    def __repr__(self):
        return "<Validation {} {} {} {} {}>".format(
            self.id, self.uid, self.eid, self.label, self.mode
        )

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class ValidationModel(BaseModel):
    def __init__(self):
        super().__init__(Validation)

    def create(self, uid, eid, label, mode, metadata={}):
        try:
            if uid == "turk":
                validation = Validation(
                    eid=eid, label=label, mode=mode, metadata_json=ujson.dumps(metadata)
                )
            else:
                validation = Validation(
                    uid=uid,
                    eid=eid,
                    label=label,
                    mode=mode,
                    metadata_json=ujson.dumps(metadata),
                )
            self.dbs.add(validation)
            return self.dbs.commit()
        except Exception as error_message:
            logger.error("Could not create validation (%s)" % error_message)
            return False

    def get(self, id):
        try:
            return self.dbs.query(Validation).filter(Validation.id == id).one()
        except db.orm.exc.NoResultFound:
            return False

    def getByEid(self, eid):
        try:
            return self.dbs.query(Validation).filter(Validation.eid == eid)
        except db.orm.exc.NoResultFound:
            return False
