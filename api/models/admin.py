# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db
from .base import Base, BaseModel

class Admin(Base):
    __tablename__ = 'admins'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)

    def __repr__(self):
        return '<Admin {}>'.format(self.id)

    def to_dict(self, safe=True):
        d = {'id': getattr(self, 'id')}
        return d

class AdminModel(BaseModel):
    def __init__(self):
        super(AdminModel, self).__init__(Admin)

    def get(self, id):
        try:
            return self.dbs.query(Admin).filter(Admin.id == id).one()
        except db.orm.exc.NoResultFound:
            return False
