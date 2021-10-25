# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import sys

import enum
import requests
import sqlalchemy as db
from transformers.data.metrics.squad_metrics import compute_f1

import common.helpers as util
from common.logging import logger

from .base import Base, BaseModel
from .dataset import AccessTypeEnum, DatasetModel
from .round import Round


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


def verify_exact_match_config(constructor_args):
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


def verify_string_f1_config(constructor_args):
    assert "reference_name" in constructor_args
    assert isinstance(constructor_args["reference_name"], str)


def ask_user(output, target, constructor_args):
    return None  # The frontend is supposed to see the None and then ask the user


def verify_ask_user_config(constructor_args):
    pass


model_wrong_metrics = {
    ModelWrongMetricEnum.exact_match.name: exact_match,
    ModelWrongMetricEnum.string_f1.name: string_f1,
    ModelWrongMetricEnum.ask_user.name: ask_user,
}

model_wrong_metric_config_verifiers = {
    ModelWrongMetricEnum.exact_match.name: verify_exact_match_config,
    ModelWrongMetricEnum.string_f1.name: verify_string_f1_config,
    ModelWrongMetricEnum.ask_user.name: verify_ask_user_config,
}


class AggregationMetricEnum(enum.Enum):
    dynascore = "dynascore"


def verify_dynascore_config(constructor_args):
    pass


aggregation_metric_config_verifiers = {
    AggregationMetricEnum.dynascore.name: verify_dynascore_config
}


class DeltaMetricEnum(enum.Enum):
    fairness = "fairness"
    robustness = "robustness"


def verify_fairness_config(constructor_args):
    # assert "perturb_fields" in constructor_args
    pass


def verify_robustness_config(constructor_args):
    # assert "perturb_fields" in constructor_args
    pass


delta_metric_config_verifiers = {
    DeltaMetricEnum.fairness.name: verify_fairness_config,
    DeltaMetricEnum.robustness.name: verify_robustness_config,
}


class PerfMetricEnum(enum.Enum):
    macro_f1 = "macro_f1"
    squad_f1 = "squad_f1"
    accuracy = "accuracy"
    sp_bleu = "sp_bleu"
    bleu = "bleu"
    vqa_accuracy = "vqa_accuracy"


def verify_macro_f1_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_vqa_accuracy_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_squad_f1_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_accuracy_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_sp_bleu_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_bleu_config(constructor_args):
    assert "reference_name" in constructor_args
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


perf_metric_config_verifiers = {
    PerfMetricEnum.macro_f1.name: verify_macro_f1_config,
    PerfMetricEnum.squad_f1.name: verify_squad_f1_config,
    PerfMetricEnum.accuracy.name: verify_accuracy_config,
    PerfMetricEnum.sp_bleu.name: verify_sp_bleu_config,
    PerfMetricEnum.bleu.name: verify_bleu_config,
}


class AnnotationTypeEnum(enum.Enum):
    image = "image"
    string = "string"
    context_string_selection = "context_string_selection"
    conf = "conf"
    multiclass_probs = "multiclass_probs"
    multiclass = "multiclass"
    target_label = "target_label"


class AnnotationVerifierMode(enum.Enum):
    default = "default"
    dataset_upload = "dataset_upload"
    predictions_upload = "predictions_upload"


class AnnotationComponent:

    # This is re-implemented for cases where an annotation component requires that we
    # store different info in the db compared to the info that we send models.
    # For example, we might want to send image blobs to a model but store a url
    # instead of a blob in the db.
    @staticmethod
    def convert_to_model_io(obj):
        return obj

    @staticmethod
    def verify(obj, obj_constructor_args, name_to_constructor_args):
        raise NotImplementedError

    @staticmethod
    def verify_config(obj, obj_constructor_args, name_to_constructor_args):
        raise NotImplementedError


class Image(AnnotationComponent):
    @staticmethod
    def convert_to_model_io(url):
        return base64.encodebytes(requests.get(url, verify=False).content).decode(
            "utf-8"
        )

    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        assert isinstance(obj, str)

    @staticmethod
    def verify_config(obj, annotation_config):
        pass


class String(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(obj, str):
                pass
            elif isinstance(obj, list):
                for sub_obj in obj:
                    assert isinstance(sub_obj, str)
            else:
                raise ValueError("Wrong type")
        else:
            assert isinstance(obj, str)

    @staticmethod
    def verify_config(obj, annotation_config):
        pass


class ContextStringSelection(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(obj, str):
                assert obj in data[constructor_args["reference_name"]]
            elif isinstance(obj, list):
                for sub_obj in obj:
                    assert isinstance(sub_obj, str)
                    assert sub_obj in data[constructor_args["reference_name"]]
            else:
                raise ValueError("Wrong type")
        elif mode == AnnotationVerifierMode.predictions_upload:
            assert isinstance(obj, str)
        else:
            assert isinstance(obj, str)
            assert obj in data[constructor_args["reference_name"]]

    @staticmethod
    def verify_config(obj, annotation_config):
        assert "reference_name" in obj["constructor_args"]
        reference_obj = list(
            filter(
                lambda other_obj: other_obj["name"]
                == obj["constructor_args"]["reference_name"],
                annotation_config["context"],
            )
        )[0]
        assert reference_obj["type"] == AnnotationTypeEnum.string.name


class Conf(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        assert isinstance(obj, float)
        assert obj > 0 - EPSILON_PREC
        assert obj < 1 + EPSILON_PREC

    @staticmethod
    def verify_config(obj, annotation_config):
        pass


class MulticlassProbs(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        assert isinstance(obj, dict)
        if mode != AnnotationVerifierMode.predictions_upload:
            assert set(obj.keys()) == set(
                name_to_constructor_args[obj_constructor_args["reference_name"]][
                    "labels"
                ]
            )
        assert sum(obj.values()) < 1 + EPSILON_PREC
        assert sum(obj.values()) > 1 - EPSILON_PREC

    @staticmethod
    def verify_config(obj, annotation_config):
        assert "reference_name" in obj["constructor_args"]
        reference_objs = filter(
            lambda other_obj: other_obj["name"]
            == obj["constructor_args"]["reference_name"],
            annotation_config["context"]
            + annotation_config["input"]
            + annotation_config["output"]
            + annotation_config["metadata"]["create"]
            + annotation_config["metadata"]["validate"],
        )
        for reference_obj in reference_objs:
            assert reference_obj["type"] in (
                AnnotationTypeEnum.multiclass.name,
                AnnotationTypeEnum.target_label.name,
            )


class Multiclass(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        assert isinstance(obj, str)
        assert obj in obj_constructor_args["labels"]

    @staticmethod
    def verify_config(obj, annotation_config):
        assert "labels" in obj["constructor_args"]
        assert isinstance(obj["constructor_args"]["labels"], list)
        for item in obj["constructor_args"]["labels"]:
            assert isinstance(item, str)


class TargetLabel(AnnotationComponent):
    @staticmethod
    def verify(
        obj,
        obj_constructor_args,
        name_to_constructor_args,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(obj, str):
                assert obj in obj_constructor_args["labels"]
            elif isinstance(obj, list):
                for sub_obj in obj:
                    assert isinstance(sub_obj, str)
                    assert sub_obj in obj_constructor_args["labels"]
            else:
                raise ValueError("Wrong type")
        else:
            assert isinstance(obj, str)
            assert obj in obj_constructor_args["labels"]

    @staticmethod
    def verify_config(obj, annotation_config):
        assert "labels" in obj["constructor_args"]
        assert isinstance(obj["constructor_args"]["labels"], list)
        for item in obj["constructor_args"]["labels"]:
            assert isinstance(item, str)


annotation_components = {
    AnnotationTypeEnum.image.name: Image,
    AnnotationTypeEnum.string.name: String,
    AnnotationTypeEnum.context_string_selection.name: ContextStringSelection,
    AnnotationTypeEnum.conf.name: Conf,
    AnnotationTypeEnum.multiclass_probs.name: MulticlassProbs,
    AnnotationTypeEnum.multiclass.name: Multiclass,
    AnnotationTypeEnum.target_label.name: TargetLabel,
}


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    annotation_config_json = db.Column(db.Text, nullable=False)

    instructions_md = db.Column(db.Text)

    desc = db.Column(db.String(length=255))

    last_updated = db.Column(db.DateTime)

    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=True)
    official = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    validate_non_fooling = db.Column(db.Boolean, default=False, nullable=False)
    num_matching_validations = db.Column(db.Integer, default=3, nullable=False)
    unpublished_models_in_leaderboard = db.Column(
        db.Boolean, default=False, nullable=False
    )
    dynalab_hr_diff = db.Column(db.Integer, default=24, nullable=False)
    dynalab_threshold = db.Column(db.Integer, default=3, nullable=False)

    instance_type = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    aws_region = db.Column(db.Text, default="us-west-1", nullable=False)
    s3_bucket = db.Column(
        db.Text, default="evaluation-us-west-1-096166425824", nullable=False
    )
    eval_server_id = db.Column(db.Text, default="default", nullable=False)
    create_endpoint = db.Column(db.Boolean, default=True)
    gpu = db.Column(db.Boolean, default=False)
    extra_torchserve_config = db.Column(db.Text)
    active = db.Column(db.Boolean, default=False)

    has_predictions_upload = db.Column(db.Boolean, default=False)
    predictions_upload_instructions_md = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

    @staticmethod
    def verify_model_wrong_metric_config(model_wrong_metric_config):
        assert "type" in model_wrong_metric_config
        assert "constructor_args" in model_wrong_metric_config
        model_wrong_metric_config_verifiers[model_wrong_metric_config["type"]](
            model_wrong_metric_config["constructor_args"]
        )

    @staticmethod
    def verify_aggregation_metric_config(aggregation_metric_config):
        assert "type" in aggregation_metric_config
        assert "constructor_args" in aggregation_metric_config
        aggregation_metric_config_verifiers[aggregation_metric_config["type"]](
            aggregation_metric_config["constructor_args"]
        )

    @staticmethod
    def verify_perf_metric_config(perf_metric_config):
        assert "type" in perf_metric_config
        assert "constructor_args" in perf_metric_config
        perf_metric_config_verifiers[perf_metric_config["type"]](
            perf_metric_config["constructor_args"]
        )

    @staticmethod
    def verify_delta_metrics_config(delta_metrics_config):
        for delta_metric_config in delta_metrics_config:
            assert "type" in delta_metric_config
            assert "constructor_args" in delta_metric_config
            delta_metric_config_verifiers[delta_metric_config["type"]](
                delta_metric_config["constructor_args"]
            )

    @staticmethod
    def verify_annotation_config(annotation_config):
        assert "aggregation_metric" in annotation_config
        Task.verify_aggregation_metric_config(annotation_config["aggregation_metric"])

        assert "model_wrong_metric" in annotation_config
        Task.verify_model_wrong_metric_config(annotation_config["model_wrong_metric"])

        assert "perf_metric" in annotation_config
        Task.verify_perf_metric_config(annotation_config["perf_metric"])

        assert "delta_metrics" in annotation_config
        Task.verify_delta_metrics_config(annotation_config["delta_metrics"])

        assert "context" in annotation_config
        assert "input" in annotation_config
        assert "output" in annotation_config
        assert "metadata" in annotation_config
        assert "create" in annotation_config["metadata"]
        assert "validate" in annotation_config["metadata"]
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
            annotation_components[obj["type"]].verify_config(obj, annotation_config)

    def verify_annotation(self, data, mode=AnnotationVerifierMode.default):
        name_to_constructor_args = {}
        name_to_type = {}
        annotation_config = util.json_decode(self.annotation_config_json)
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
                    annotation_components[name_to_type[name]].verify(
                        datum,
                        name_to_constructor_args[name],
                        name_to_constructor_args,
                        data,
                        mode,
                    )
                except Exception as e:
                    logger.error(name + " is improperly formatted (" + str(e) + ")")
                    return False
        return True

    def convert_to_model_io(self, data):
        name_to_type = {}
        annotation_config = util.json_decode(self.annotation_config_json)
        annotation_config_objs = (
            annotation_config["context"]
            + annotation_config["output"]
            + annotation_config["input"]
            + annotation_config["metadata"]["create"]
            + annotation_config["metadata"]["validate"]
        )

        for annotation_config_obj in annotation_config_objs:
            name_to_type[annotation_config_obj["name"]] = annotation_config_obj["type"]

        converted_data = util.json_decode(util.json_encode(data))
        for key, value in data.items():
            if key in name_to_type:
                converted_data[key] = annotation_components[
                    name_to_type[key]
                ].convert_to_model_io(value)

        return converted_data


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
        # TODO:  allow this to be settable by the task owner?
        return 5

    def get_default_metric_weight(self, task, field_name, perf_metric_field_name):
        # TODO: allow this to be settable by the task owner?
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
            annotation_config = util.json_decode(t_dict["annotation_config_json"])
            # TODO: make the frontend use perf_metric instead of perf_metric_field_name?
            if "perf_metric" in annotation_config:
                t_dict["perf_metric_field_name"] = annotation_config["perf_metric"][
                    "type"
                ]
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
