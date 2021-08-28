# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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


EPSILON_PREC = 1e-4


class ModelWrongMetricEnum(enum.Enum):
    exact_match = "exact_match"
    string_f1 = "string_f1"
    ask_user = "ask_user"


def exact_match(output, target, constructor_args):
    results = []
    for name in constructor_args["reference_names"]:
        results.append(output[name] != target[name])
    if True in results:
        return True
    return False


def verify_exact_match(constructor_args):
    assert "reference_names" in constructor_args
    assert isinstance(constructor_args["reference_names"], list)
    for name in constructor_args["reference_names"]:
        isinstance(name, str)


def string_f1(output, target, constructor_args):
    return (
        compute_f1(
            output[constructor_args["reference_name"]],
            target[constructor_args["reference_name"]],
        )
        < constructor_args["threshold"]
    )


def verify_string_f1(constructor_args):
    assert "reference_name" in constructor_args
    assert isinstance(constructor_args["reference_name"], str)


def ask_user(output, target, constructor_args):
    return None  # The frontend is supposed to see the None and then ask the user


def verify_ask_user(constructor_args):
    pass


model_wrong_metrics = {
    ModelWrongMetricEnum.exact_match.name: exact_match,
    ModelWrongMetricEnum.string_f1.name: string_f1,
    ModelWrongMetricEnum.ask_user.name: ask_user,
}

model_wrong_metric_verifiers = {
    ModelWrongMetricEnum.exact_match.name: verify_exact_match,
    ModelWrongMetricEnum.string_f1.name: verify_string_f1,
    ModelWrongMetricEnum.ask_user.name: verify_ask_user,
}


class PerfMetricEnum(enum.Enum):
    macro_f1 = "macro_f1"
    squad_f1 = "squad_f1"
    accuracy = "accuracy"
    sp_bleu = "sp_bleu"
    bleu = "bleu"


class AggregationMetricEnum(enum.Enum):
    dynascore = "dynascore"


class AnnotationTypeEnum(enum.Enum):
    image_url = "image_url"
    string = "string"
    context_string_selection = "context_string_selection"
    conf = "conf"
    multiclass_probs = "multiclass_probs"
    multiclass = "multiclass"
    target_label = "target_label"


def verify_config_obj_base(obj):
    assert "name" in obj
    assert "type" in obj
    assert "constructor_args" in obj


def verify_image_url(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, str)


def verify_image_url_config(obj, annotation_config):
    pass


def verify_string(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, str)


def verify_string_config(obj, annotation_config):
    pass


def verify_context_string_selection(
    obj, constructor_args, name_to_constructor_args, data
):
    assert isinstance(obj, str)
    assert obj in data[constructor_args["reference_name"]]


def verify_context_string_selection_config(obj, annotation_config):
    assert "reference_name" in obj["constructor_args"]
    reference_obj = filter(
        lambda other_obj: other_obj["name"]
        == obj["constructor_args"]["reference_name"],
        annotation_config["context"],
    )[0]
    assert reference_obj["type"] == AnnotationTypeEnum.string.name


def verify_conf(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, float)
    assert obj > 0 - EPSILON_PREC
    assert obj < 1 + EPSILON_PREC


def verify_conf_config(obj, annotation_config):
    pass


def verify_multiclass_probs(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, dict)
    assert set(obj.keys()) == set(
        name_to_constructor_args[obj_constructor_args["reference_name"]]["labels"]
    )
    assert sum(obj.values()) < 1 + EPSILON_PREC
    assert sum(obj.values()) > 1 - EPSILON_PREC


def verify_multiclass_probs_config(obj, annotation_config):
    assert "reference_name" in obj["constructor_args"]
    reference_obj = filter(
        lambda other_obj: other_obj["name"]
        == obj["constructor_args"]["reference_name"],
        annotation_config["context"],
    )[0]
    assert reference_obj["type"] in (
        AnnotationTypeEnum.multiclass_probs.name,
        AnnotationTypeEnum.target_label.name,
    )


def verify_multiclass(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, str)
    assert obj in obj_constructor_args["labels"]


def verify_multiclass_config(obj, annotation_config):
    assert "labels" in obj["constructor_args"]
    assert isinstance(obj["constructor_args"]["labels"], list)
    for item in obj["constructor_args"]["labels"]:
        assert isinstance(item, str)


def verify_target_label(obj, obj_constructor_args, name_to_constructor_args, data):
    assert isinstance(obj, str)
    assert obj in obj_constructor_args["labels"]


def verify_target_label_config(obj, annotation_config):
    assert "labels" in obj["constructor_args"]
    assert isinstance(obj["constructor_args"]["labels"], list)
    for item in obj["constructor_args"]["labels"]:
        assert isinstance(item, str)


annotation_type_verifiers = {
    AnnotationTypeEnum.image_url.name: verify_image_url,
    AnnotationTypeEnum.string.name: verify_string,
    AnnotationTypeEnum.context_string_selection.name: verify_context_string_selection,
    AnnotationTypeEnum.conf.name: verify_conf,
    AnnotationTypeEnum.multiclass_probs.name: verify_multiclass_probs,
    AnnotationTypeEnum.multiclass.name: verify_multiclass,
    AnnotationTypeEnum.target_label.name: verify_target_label,
}

annotation_type_config_verifiers = {
    AnnotationTypeEnum.image_url.name: verify_image_url_config,
    AnnotationTypeEnum.string.name: verify_string_config,
    AnnotationTypeEnum.context_string_selection.name: verify_context_string_selection_config,  # noqa
    AnnotationTypeEnum.conf.name: verify_conf_config,
    AnnotationTypeEnum.multiclass_probs.name: verify_multiclass_probs_config,
    AnnotationTypeEnum.multiclass.name: verify_multiclass_config,
    AnnotationTypeEnum.target_label.name: verify_target_label_config,
}


class TaskProposal(Base):
    __tablename__ = "task_proposals"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    uid = db.Column(db.Integer, db.ForeignKey("users.id"))

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), unique=True, nullable=False)
    annotation_config_json = db.Column(db.Text, nullable=False)
    aggregation_metric = db.Column(
        db.Enum(AggregationMetricEnum),
        default=AggregationMetricEnum.dynascore,
        nullable=False,
    )
    model_wrong_metric = db.Column(db.Text, nullable=False)
    instructions_md = db.Column(db.Text, nullable=False)

    desc = db.Column(db.String(length=255))

    hidden = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)

    instance_type = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    eval_metrics = db.Column(db.Text, default="macro_f1", nullable=False)
    perf_metric = db.Column(db.Text, default="macro_f1", nullable=False)
    delta_metrics = db.Column(db.Text, default="fairness|robustness", nullable=True)
    create_endpoint = db.Column(db.Boolean, default=True)
    gpu = db.Column(db.Boolean, default=False)
    extra_torchserve_config = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    annotation_config_json = db.Column(db.Text, nullable=False)
    aggregation_metric = db.Column(
        db.Enum(AggregationMetricEnum),
        default=AggregationMetricEnum.dynascore,
        nullable=False,
    )
    model_wrong_metric = db.Column(db.Text, nullable=False)
    instructions_md = db.Column(db.Text)

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
    extra_torchserve_config = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

    @staticmethod
    def verify_model_wrong_metric(model_wrong_metric):
        assert "type" in model_wrong_metric
        assert "constructor_args" in model_wrong_metric
        model_wrong_metric_verifiers[model_wrong_metric["type"]](
            model_wrong_metric["constructor_args"]
        )

    @staticmethod
    def verify_annotation_config(annotation_config):
        assert "context" in annotation_config
        assert "input" in annotation_config
        assert "output" in annotation_config
        assert "metadata" in annotation_config
        assert ["create"] in annotation_config["metadata"]
        assert ["validate"] in annotation_config["metadata"]
        annotation_config_objs = (
            annotation_config["context"]
            + annotation_config["output"]
            + annotation_config["input"]
            + annotation_config["metadata"]["create"]
            + annotation_config["metadata"]["validate"]
        )
        for obj in annotation_config_objs:
            assert "name" in obj
            assert isinstance(obj["name"], str)
            assert "constructor_args" in obj
            assert isinstance(obj["constructor_args"], dict)
            assert "type" in obj
            assert isinstance(obj["type"], str)
            annotation_type_config_verifiers[obj["type"]](obj, annotation_config)

    def verify_annotation(self, data):
        name_to_constructor_args = {}
        name_to_type = {}
        annotation_config = json.loads(self.annotation_config_json)
        annotation_config_objs = (
            annotation_config["context"]
            + annotation_config["output"]
            + annotation_config["input"]
            + annotation_config["metadata"]["create"]
            + annotation_config["metadata"]["validate"]
        )

        for annotation_config_obj in annotation_config_objs:
            name_to_constructor_args[
                annotation_config_obj["name"]
            ] = annotation_config_obj["constructor_args"]
            name_to_type[annotation_config_obj["name"]] = annotation_config_obj["type"]

        for name, datum in data.items():
            if (
                name in name_to_type
            ):  # TODO This check is necessary for non-dynalab models.
                # Can be removed when dynatask-dynalab integration is complete.
                try:
                    annotation_type_verifiers[name_to_type[name]](
                        datum,
                        name_to_constructor_args[name],
                        name_to_constructor_args,
                        data,
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

    def getByName(self, name):
        try:
            return self.dbs.query(Task).filter(Task.name == name).one()
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
            # TODO: make the frontend use perf_metric instead of perf_metric_field_name?
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
