# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import enum
import sqlalchemy as db
from .base import Base, BaseModel

class LabelEnum(enum.Enum):
    flagged = 'flagged'
    correct = 'correct'
    incorrect = 'incorrect'

class ModeEnum(enum.Enum):
    user = 'user'
    owner = 'owner'

class Validation(Base):
    __tablename__ = 'validations'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    eid = db.Column(db.Integer, db.ForeignKey("examples.id"), nullable=False)
    label = db.Column(db.Enum(LabelEnum))
    mode = db.Column(db.Enum(ModeEnum))

    def __repr__(self):
        return '<Validation {} {} {} {} {}>'.format(
            self.id, self.uid, self.eid, self.label, self.mode)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

class ValidationModel(BaseModel):
    def __init__(self):
        super(ValidationModel, self).__init__(Validation)

    def create(self, uid, eid, label, mode):
        validation = Validation(uid=uid, eid=eid, label=label, mode=mode)
        self.dbs.add(validation)
        return self.dbs.commit()

    def get(self, id):
        try:
            return self.dbs.query(Validation).filter(Validation.id == id).one()
        except db.orm.exc.NoResultFound:
            return False
