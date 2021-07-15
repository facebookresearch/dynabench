# Copyright (c) Facebook, Inc. and its affiliates.

import json
import sys

import enum
import sqlalchemy as db

from .base import Base, BaseModel
from .dataset import AccessTypeEnum, DatasetModel
from .round import Round
from .user import User


sys.path.append("../evaluation")  # noqa
import metrics  # isort:skip


class ModelCorrectMetricEnum(enum.Enum):
    exact_match = "exact_match"


def is_model_correct_exact_match(model_output, human_output):
    return model_output == human_output


class PerfMetricEnum(enum.Enum):
    macro_f1 = "macro_f1"
    squad_f1 = "squad_f1"
    accuracy = "accuracy"
    sp_bleu = "sp_bleu"
    bleu = "bleu"


class AggregationMetricEnum(enum.Enum):
    dynascore = "dynascore"


class IOTypeEnum(enum.Enum):
    image_url = "image_url"
    string = "string"
    multiple_choice = "multiple_choice"
    string_selection = "string_selection"
    multinomial_distribution = "multinomial_distribution"


class LocationEnum(enum.Enum):
    context = "context"
    input = "input"
    output = "output"
    info = "model_response_info"


class IO:
    def __init__(self, io_definition, key):
        assert key in io_definition
        assert "constructor_args" in io_definition[key]
        assert "type" in io_definition[key]
        assert io_definition[key]["type"] in map(lambda e: e.name, IOTypeEnum)
        assert "location" in io_definition[key]
        assert io_definition[key]["location"] in map(lambda e: e.name, LocationEnum)
        self.key = key

    def verify_example_io(self, example_io):
        raise NotImplementedError


class StringIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert isinstance(example_io[self.key], str)


class MultipleChoiceProbsIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)
        self.reference_key = io_definition[key]["constructor_args"]["reference_key"]
        assert self.reference_key in io_definition

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert sum(example_io[self.key].values()) == 1
        assert set(example_io[self.reference_key]) == set(example_io[self.key].keys())


class ConfIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert example_io[self.key] <= 1
        assert example_io[self.key] >= 0


class ImageUrlIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert isinstance(example_io[self.key], str)


class MultipleChoiceIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)
        self.labels = io_definition[key]["constructor_args"]["labels"]

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert example_io[self.key] in self.labels


class StringSelectionIO(IO):
    def __init__(self, io_definition, key):
        IO.__init__(self, io_definition, key)
        self.reference_key = io_definition[key]["constructor_args"]["reference_key"]
        assert self.reference_key in io_definition

    def verify_example_io(self, example_io):
        assert self.key in example_io
        assert self.reference_key in example_io
        assert example_io[self.key] in example_io[self.reference_key]


io_types = {
    IOTypeEnum.image_url.name: ImageUrlIO,
    IOTypeEnum.string.name: StringIO,
    IOTypeEnum.multiple_choice.name: MultipleChoiceIO,
    IOTypeEnum.string_selection.name: StringSelectionIO,
}
perf_metrics = set(PerfMetricEnum)
aggregation_metrics = set(AggregationMetricEnum)
model_correct_metrics = {"exact_match": is_model_correct_exact_match}


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    io_definition = db.Column(db.Text, nullable=False)
    perf_metric = db.Column(db.Enum(PerfMetricEnum), nullable=False)
    aggregation_metric = db.Column(
        db.Enum(AggregationMetricEnum),
        default=AggregationMetricEnum.dynascore,
        nullable=False,
    )
    model_correct_metric = db.Column(
        db.Enum(ModelCorrectMetricEnum),
        default=ModelCorrectMetricEnum.exact_match,
        nullable=False,
    )

    # shortname = db.Column(db.String(length=255), nullable=False, unique=True)
    # task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    # Task type is either 'clf' or 'extract' for now
    # type = db.Column(db.String(length=255), nullable=False, default="clf")

    # owner_str = db.Column(db.Text)

    desc = db.Column(db.String(length=255))
    # longdesc = db.Column(db.Text)
    # targets = db.Column(db.Text)  # ordered list of target labels
    # ordered list of max scores per round
    # score_progression = db.Column(db.Text)

    # total_verified = db.Column(db.Integer, default=0)
    # total_collected = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime)

    # cur_round = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    # has_context = db.Column(db.Boolean, default=True)
    # has_answer = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)

    instance = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    eval_metrics = db.Column(db.Text, default="macro_f1", nullable=False)
    perf_metric = db.Column(db.Text, default="macro_f1", nullable=False)
    delta_metrics = db.Column(db.Text, default="fairness|robustness", nullable=False)
    aws_region = db.Column(db.Text, default="us-west-1", nullable=False)
    s3_bucket = db.Column(
        db.Text, default="evaluation-us-west-1-096166425824", nullable=False
    )

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
            t_dict["perf_metric_field_name"] = t_dict["perf_metric"]
            metrics_meta, ordered_field_names = metrics.get_task_metrics_meta(t)
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
