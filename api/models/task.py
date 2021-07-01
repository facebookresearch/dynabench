# Copyright (c) Facebook, Inc. and its affiliates.

import json
import sys

import sqlalchemy as db

from .base import Base, BaseModel
from .dataset import AccessTypeEnum, DatasetModel
from .round import Round
from .user import User


sys.path.append("../evaluation")  # noqa
import metrics  # isort:skip


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    shortname = db.Column(db.String(length=255), nullable=False, unique=True)
    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

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
    submitable = db.Column(db.Boolean, default=False)

    has_context = db.Column(db.Boolean, default=True)
    has_answer = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)

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

    def listSubmitable(self):
        rows = self.dbs.query(Task).filter(Task.submitable.is_(True)).all()
        tasks = [x.to_dict() for x in rows]
        return tasks

    def get_default_dataset_weight(self, task, name):
        if task.settings_json is not None:
            weight = (
                json.loads(task.settings_json)
                .get("default_dataset_weights", {})
                .get(name, None)
            )
            if weight is not None:
                return weight
        return 5

    def get_default_metric_weight(self, task, field_name, perf_metric_field_name):
        if task.settings_json is not None:
            weight = (
                json.loads(task.settings_json)
                .get("default_metric_weights", {})
                .get(field_name, None)
            )
            if weight is not None:
                return weight
        if field_name == perf_metric_field_name:
            return 4
        return 1

    def getWithRoundAndMetricMetadata(self, tid):

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
            scoring_dataset_list = []
            for dataset in datasets:
                dataset_list.append({"id": dataset.id, "name": dataset.name})
                if dataset.access_type == AccessTypeEnum.scoring:
                    scoring_dataset_list.append(
                        {
                            "id": dataset.id,
                            "name": dataset.name,
                            "default_weight": self.get_default_dataset_weight(
                                t, dataset.name
                            ),
                        }
                    )
            dataset_list.sort(key=lambda dataset: dataset["id"])
            scoring_dataset_list.sort(key=lambda dataset: dataset["id"])

            t_dict = t.to_dict()
            r_dict = r.to_dict()
            t_dict["ordered_scoring_datasets"] = scoring_dataset_list
            t_dict["ordered_datasets"] = dataset_list
            shortname_to_metrics_task_name = {
                "NLI": "nli",
                "QA": "qa",
                "Sentiment": "sentiment",
                "Hate Speech": "hs",
                "FLORES-SMALL1": "flores_small1",
                "FLORES-SMALL2": "flores_small2",
                "FLORES-FULL": "flores_full",
            }
            if t_dict["shortname"] in shortname_to_metrics_task_name:
                metrics_task_name = shortname_to_metrics_task_name[t_dict["shortname"]]
                t_dict["perf_metric_field_name"] = metrics.get_task_config_safe(
                    metrics_task_name
                )["perf_metric"]
                metrics_meta, ordered_field_names = metrics.get_task_metrics_meta(
                    metrics_task_name
                )
                ordered_metrics = [
                    dict(
                        {
                            "name": metrics_meta[field_name]["pretty_name"],
                            "field_name": field_name,
                            "default_weight": self.get_default_metric_weight(
                                t, field_name, t_dict["perf_metric_field_name"]
                            ),
                        },
                        **metrics_meta[field_name],
                    )
                    for field_name in ordered_field_names
                ]
            else:
                ordered_metrics = []

            t_dict["ordered_metrics"] = ordered_metrics
            t_dict["round"] = r_dict
            return t_dict
        except db.orm.exc.NoResultFound:
            return False

    def getByTaskCode(self, task_code):
        try:
            return self.dbs.query(Task).filter(Task.task_code == task_code).one()
        except db.orm.exc.NoResultFound:
            return False
