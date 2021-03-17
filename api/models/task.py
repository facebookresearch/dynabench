# Copyright (c) Facebook, Inc. and its affiliates.

import json

import sqlalchemy as db

from .base import Base, BaseModel
from .dataset import DatasetModel
from .round import Round
from .user import User


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    shortname = db.Column(db.String(length=255), nullable=False, unique=True)
    task_code = db.Column(db.String(length=255), unique=True)

    # Task type is either 'clf' or 'extract' for now
    type = db.Column(db.String(length=255), nullable=False, default="clf")

    owner_str = db.Column(db.Text)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)
    targets = db.Column(db.Text)  # ordered list of target labels
    # ordered list of max scores per round
    score_progression = db.Column(db.Text)

    total_verified = db.Column(db.Integer, default=0)
    total_collected = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime)

    # cur_round = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=False)

    has_context = db.Column(db.Boolean, default=True)
    has_answer = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)
    ordered_metrics_json = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


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


class TaskModel(BaseModel):
    def __init__(self):
        super().__init__(Task)

    def getByShortName(self, shortname):
        try:
            return self.dbs.query(Task).filter(Task.shortname == shortname).one()
        except db.orm.exc.NoResultFound:
            return False

    def listWithRounds(self, exclude_hidden=True):
        rows = self.dbs.query(Task, Round).join(
            Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round)
        )
        if exclude_hidden:
            rows = rows.filter(Task.hidden.is_(False))
        rows = rows.all()
        tasks = [x[0].to_dict() for x in rows]
        for ii, r in enumerate([x[1] for x in rows]):
            tasks[ii]["round"] = r.to_dict()
        return tasks

    def getWithRound(self, tid):
        try:
            t, r = (
                self.dbs.query(Task, Round)
                .filter(Task.id == tid)
                .join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
                .one()
            )
            dm = DatasetModel()
            datasets = dm.getByTid(tid)
            dataset_list = []
            for dataset in datasets:
                dataset_list.append({"id": dataset.id, "name": dataset.name})
            dataset_list.sort(key=lambda item: item["id"])

            t = t.to_dict()
            t["round"] = r.to_dict()
            t["ordered_datasets"] = dataset_list
            t["ordered_metrics"] = json.loads(t["ordered_metrics_json"])
            del t["ordered_metrics_json"]
            return t
        except db.orm.exc.NoResultFound:
            return False

    def getByTaskCode(self, task_code):
        try:
            return self.dbs.query(Task).filter(Task.task_code == task_code).one()
        except db.orm.exc.NoResultFound:
            return False
