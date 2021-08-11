# Copyright (c) Facebook, Inc. and its affiliates.

import json
import sys

import enum
import sqlalchemy as db
from transformers.data.metrics.squad_metrics import compute_f1

from common.logging import logger

from .base import Base, BaseModel
from .dataset import AccessTypeEnum, DatasetModel
from .round import Round
from .user import User


sys.path.append("../evaluation")  # noqa
from metrics.metric_getters import get_task_metrics_meta  # isort:skip


class ModelWrongMetricEnum(enum.Enum):
    exact_match = "exact_match"
    string_f1 = "string_f1"
    ask_user = "ask_user"


def exact_match(model_output, human_output):
    return model_output != human_output


def string_f1(model_output, human_output):
    assert len(model_output.values()) == 1
    assert len(human_output.values()) == 1
    return (
        compute_f1(list(model_output.values())[0], list(human_output.values())[0]) < 0.9
    )


def ask_user(model_output, human_output):
    return None  # The frontend is supposed to see the None and then ask the user


model_wrong_metrics = {
    ModelWrongMetricEnum.exact_match.name: exact_match,
    ModelWrongMetricEnum.string_f1.name: string_f1,
    ModelWrongMetricEnum.ask_user.name: ask_user,
}


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
    context_string_selection = "context_string_selection"
    conf = "conf"
    multiple_choice_probs = "multiple_choice_probs"
    multiple_choice = "multiple_choice"
    goal_message_multiple_choice = "goal_message_multiple_choice"


def verify_image_url(obj, obj_constructor_args, name_to_constructor_args, example_io):
    assert isinstance(obj, str)


def verify_string(obj, obj_constructor_args, name_to_constructor_args, example_io):
    assert isinstance(obj, str)


def verify_context_string_selection(
    obj, constructor_args, name_to_constructor_args, example_io
):
    assert isinstance(obj, str)
    assert obj in example_io[constructor_args["reference_key"]]


def verify_conf(obj, obj_constructor_args, name_to_constructor_args, example_io):
    assert isinstance(obj, float)
    assert obj >= 0
    assert obj <= 1


def verify_multiple_choice_probs(
    obj, obj_constructor_args, name_to_constructor_args, example_io
):
    assert isinstance(obj, dict)
    assert set(obj.keys()) == set(
        name_to_constructor_args[obj_constructor_args["reference_key"]]["labels"]
    )
    assert sum(obj.values()) < 1.001
    assert sum(obj.values()) > 0.999


def verify_multiple_choice(
    obj, obj_constructor_args, name_to_constructor_args, example_io
):
    assert isinstance(obj, str)
    assert obj in obj_constructor_args["labels"]


def verify_goal_message_multiple_choice(
    obj, obj_constructor_args, name_to_constructor_args, example_io
):
    assert isinstance(obj, str)
    assert obj in obj_constructor_args["labels"]


io_type_verifiers = {
    IOTypeEnum.image_url.name: verify_image_url,
    IOTypeEnum.string.name: verify_string,
    IOTypeEnum.context_string_selection.name: verify_context_string_selection,
    IOTypeEnum.conf.name: verify_conf,
    IOTypeEnum.multiple_choice_probs.name: verify_multiple_choice_probs,
    IOTypeEnum.multiple_choice.name: verify_multiple_choice,
    IOTypeEnum.goal_message_multiple_choice.name: verify_goal_message_multiple_choice,
}


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    input_io_def = db.Column(db.Text, nullable=False)
    output_io_def = db.Column(db.Text, nullable=False)
    context_io_def = db.Column(db.Text, nullable=False)
    user_metadata_model_correct_io_def = db.Column(db.Text, nullable=False)
    user_metadata_model_wrong_io_def = db.Column(db.Text, nullable=False)
    model_metadata_io_def = db.Column(db.Text, nullable=False)
    aggregation_metric = db.Column(
        db.Enum(AggregationMetricEnum),
        default=AggregationMetricEnum.dynascore,
        nullable=False,
    )
    model_wrong_metric = db.Column(
        db.Enum(ModelWrongMetricEnum),
        default=ModelWrongMetricEnum.exact_match,
        nullable=False,
    )
    instructions = db.Column(db.Text)
    goal_message = db.Column(db.Text)
    warning_message = db.Column(db.Text)

    desc = db.Column(db.String(length=255))

    last_updated = db.Column(db.DateTime)

    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)

    instance_type = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    eval_metrics = db.Column(db.Text, default="macro_f1", nullable=False)
    perf_metric = db.Column(db.Text, default="macro_f1", nullable=False)
    delta_metrics = db.Column(db.Text, default="fairness|robustness", nullable=True)
    aws_region = db.Column(db.Text, default="us-west-1", nullable=False)
    s3_bucket = db.Column(
        db.Text, default="evaluation-us-west-1-096166425824", nullable=False
    )
    eval_server_id = db.Column(db.Text, default="default", nullable=False)
    create_endpoint = db.Column(db.Boolean, default=True)
    gpu = db.Column(db.Boolean, default=False)
    torchserve_config = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

    def verify_io(self, io_objs, model_wrong):
        name_to_constructor_args = {}
        name_to_type = {}
        user_metadata_io_def = []
        if model_wrong is not None:
            user_metadata_io_def = (
                json.loads(self.user_metadata_model_wrong_io_def)
                if model_wrong
                else json.loads(self.user_metadata_model_correct_io_def)
            )
        for item in (
            json.loads(self.input_io_def)
            + json.loads(self.output_io_def)
            + json.loads(self.context_io_def)
            + user_metadata_io_def
            + json.loads(self.model_metadata_io_def)
        ):
            name_to_constructor_args[item["name"]] = item["constructor_args"]
            name_to_type[item["name"]] = item["type"]
        for name, obj in io_objs.items():
            if (
                name in name_to_type
            ):  # TODO This check is necessary for non-dynalab models.
                # Can be removed when dynatask-dynalab integration is complete.
                try:
                    io_type_verifiers[name_to_type[name]](
                        obj,
                        name_to_constructor_args[name],
                        name_to_constructor_args,
                        io_objs,
                    )
                except Exception:
                    logger.error(name + " is improperly formatted")
                    return False
        return True


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

    def getByTaskCode(self, task_code):
        try:
            return self.dbs.query(Task).filter(Task.task_code == task_code).one()
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

    def getWithRoundAndMetricMetadata(self, task_id_or_code):
        try:
            if isinstance(task_id_or_code, int) or task_id_or_code.isdigit():
                t, r = (
                    self.dbs.query(Task, Round)
                    .filter(Task.id == task_id_or_code)
                    .join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
                    .one()
                )
            else:
                t, r = (
                    self.dbs.query(Task, Round)
                    .filter(Task.task_code == task_id_or_code)
                    .join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
                    .one()
                )
            dm = DatasetModel()
            datasets = dm.getByTid(t.id)
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
            # TODO: make the frontend use pert_metric instead of perf_metric_field_name?
            metrics_meta, ordered_field_names = get_task_metrics_meta(t)
            ordered_metrics = [
                dict(
                    {
                        "name": metrics_meta[field_name]["pretty_name"],
                        # TODO: make the frontend use pretty_name?
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
