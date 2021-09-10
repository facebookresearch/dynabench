# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db

import common.helpers as util

from .base import Base, BaseModel
from .task import Task
from .user import User


class TaskUserPermission(Base):
    __tablename__ = "task_user_permissions"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"))
    # For now, the only recognized type is 'owner'
    type = db.Column(db.String(255))
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"))

    task = db.orm.relationship(Task, backref="task_permissions")
    user = db.orm.relationship(User, backref="task_permissions")

    def __repr__(self):
        return f"<TaskUserPermission {self.id}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class TaskUserPermissionModel(BaseModel):
    def __init__(self):
        super().__init__(Task)

    def getByOwnerUid(self, uid, n=5, offset=0):
        query_res = (
            self.dbs.query(Task)
            .join(TaskUserPermission, (TaskUserPermission.tid == Task.id))
            .filter(TaskUserPermission.uid == uid)
            .filter(TaskUserPermission.type == "owner")
        )
        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)
