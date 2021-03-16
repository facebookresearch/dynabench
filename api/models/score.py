# Copyright (c) Facebook, Inc. and its affiliates.

import json

import numpy as np
import sqlalchemy as db

from common import helpers as util
from models.dataset import Dataset
from models.round import Round
from models.task import TaskModel
from models.user import User

from .base import Base, BaseModel
from .model import Model


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("models.id"), nullable=False)
    model = db.orm.relationship("Model", foreign_keys="Score.mid")
    r_realid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Score.r_realid")
    did = db.Column(db.Integer, db.ForeignKey("datasets.id"))

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)

    pretty_perf = db.Column(db.String(length=255))
    perf = db.Column(db.Float(), default=0.0)

    raw_upload_data = db.Column(db.Text)
    raw_output_s3_uri = db.Column(db.Text)
    eval_id_start = db.Column(db.Integer, default=-1)
    eval_id_end = db.Column(db.Integer, default=-1)
    metadata_json = db.Column(db.Text)

    memory_utilization = db.Column(db.Float)
    examples_per_second = db.Column(db.Float)

    def __repr__(self):
        return f"<Score {self.id}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class ScoreModel(BaseModel):
    def __init__(self):
        super().__init__(Score)

    def create(self, r_realid, model_id, **kwargs):
        m = Score(r_realid=r_realid, mid=model_id, **kwargs)
        self.dbs.add(m)
        return self.dbs.commit()

    def bulk_create(self, model_id, score_objs=[], raw_upload_data=""):
        self.dbs.add_all(
            [
                Score(
                    r_realid=score_obj["r_realid"],
                    mid=model_id,
                    desc=score_obj["desc"],
                    longdesc=score_obj["longdesc"],
                    pretty_perf=score_obj["pretty_perf"],
                    perf=score_obj["perf"],
                    raw_upload_data=raw_upload_data,
                    eval_id_start=score_obj.get("start_index", -1),
                    eval_id_end=score_obj.get("end_index", -1),
                    metadata_json=json.dumps(score_obj["metadata_json"]),
                    memory_utilization=score_obj.get("memory_utilization", None),
                    examples_per_second=score_obj.get("examples_per_second", None),
                )
                for score_obj in score_objs
            ]
        )
        return self.dbs.commit()

    def getDynaboardByTask(
        self,
        tid,
        metric_to_weight,
        did_to_weight,
        sort_by="dynascore",
        reverse_sort=False,
        limit=5,
        offset=0,
    ):
        # TODO: normalize weights
        t = TaskModel()
        task = t.getWithRound(tid)
        ordered_datasets = json.loads(task.ordered_datasets)
        ordered_dataset_ids = [dataset["id"] for dataset in ordered_datasets]
        ordered_metrics = json.loads(task.ordered_metrics)
        ordered_metric_weights = [
            metric_to_weight[metric["name"]] for metric in ordered_metrics
        ]
        scores = (
            self.dbs.query().join(Score, Score.mid == Model.id).filter(Model.tid == tid)
        )
        models = self.dbs.query(Model)
        users = self.dbs.query(User)
        datasets = self.dbs.query(Dataset)
        mid_to_uid = {}
        mid_to_name = {}
        uid_to_username = {}
        did_to_name = {}
        for user in users:
            uid_to_username[user.id] = user.username
        for model in models:
            mid_to_uid[model.id] = model.uid
            mid_to_name[model.id] = model.name
        for dataset in datasets:
            did_to_name[dataset.did] = dataset.name

        mid_to_data = {}
        for score in scores:
            score_dict = score.to_dict()
            if score.mid not in mid_to_data:
                mid_to_data[score.mid] = {
                    "model_id": score.mid,
                    "model_name": mid_to_name[score.mid],
                    "uid": mid_to_uid[score.uid],
                    "username": uid_to_username[mid_to_uid[score.mid]],
                    "datasets": [],
                }
            mid_to_data[score.mid]["datasets"].append(
                {
                    "id": score.did,
                    "name": did_to_name[score.did],
                    "scores": np.array(
                        [score_dict[metric["field_name"]] for metric in ordered_metrics]
                    ),
                }
            )

        # Compute variances and aggregates
        count = 0
        for datum in mid_to_data.values():
            count += 1
            id_to_datasets = {}
            for dataset in datum["datasets"]:
                if dataset["id"] in id_to_datasets:
                    id_to_datasets["id"].append(dataset)
                else:
                    id_to_datasets["id"] = [dataset]
            new_datasets = []
            all_dataset_score_list = []
            all_dataset_variance_list = []
            for datasets in sorted(
                id_to_datasets.values(),
                key=lambda value: ordered_dataset_ids.index(value["id"]),
            ):
                score_list = []
                for dataset in datasets:
                    score_list.append(dataset["scores"])
                mean_scores = np.mean(score_list, axis=0)
                variances = np.var(score_list, axis=0)
                all_dataset_score_list.append(
                    mean_scores * did_to_weight[dataset["id"]]
                )
                all_dataset_variance_list.append(
                    variances * did_to_weight[dataset["id"]]
                )
                new_datasets.append(
                    {
                        "id": dataset["id"],
                        "name": dataset["name"],
                        "scores": mean_scores.tolist(),
                        "variances": variances.tolist(),
                    }
                )
            datum["averaged_scores"] = np.sum(all_dataset_score_list).tolist()
            datum["averaged_variances"] = np.sum(all_dataset_variance_list).tolist()
            datum["dynascore"] = np.dot(
                all_dataset_score_list, np.array(ordered_metric_weights)
            ).tolist()
            datum["dynavariance"] = np.dot(
                all_dataset_score_list, np.array(ordered_metric_weights)
            ).tolist()
            datum["datasets"] = new_datasets

        data_list = list(mid_to_data.values())

        if sort_by == "dynascore":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["dynascore"])
        elif sort_by in ordered_metrics:
            data_list.sort(
                reverse=reverse_sort,
                key=lambda model: model["averaged_scores"][
                    ordered_metrics.index(sort_by)
                ],
            )
        elif sort_by == "model_name":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["model_name"])

        return util.json_encode(
            {"count": count, "data": data_list[offset : offset + limit]}
        )

    def getOverallModelPerfByTask(self, tid, n=5, offset=0):
        # Main query to fetch the model details
        query_res = (
            self.dbs.query(
                Model.id,
                Model.name,
                User.username,
                User.id,
                db.sql.func.avg(Score.perf).label("avg_perf"),
            )
            .join(Score, Score.mid == Model.id)
            .join(User, User.id == Model.uid)
            .filter(Model.tid == tid)
            .filter(Model.is_published == True)  # noqa
            .group_by(Model.id)
            .order_by(db.sql.func.avg(Score.perf).desc())
        )

        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)

    def getModelPerfByTidAndRid(self, tid, rid, n=5, offset=0):
        # main query to fetch the model details
        query_res = (
            self.dbs.query(
                Model.id,
                Model.name,
                User.username,
                User.id,
                Score.perf,
                Score.metadata_json,
            )
            .join(Score, Score.mid == Model.id, isouter=True)
            .join(User, User.id == Model.uid, isouter=True)
            .join(Round, Round.id == Score.r_realid, isouter=True)
            .filter(Model.tid == tid)
            .filter(Round.rid == rid)
            .filter(Model.is_published == True)  # noqa
            .order_by((Score.perf).desc())
        )

        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)

    def getTrendsByTid(self, tid, n=10, offset=0):
        # subquery to get the top performance model
        sub_query = (
            self.dbs.query(Model.id.label("m_id"), Model.name)
            .join(Score, Score.mid == Model.id)
            .filter(Model.tid == tid)
            .filter(Model.is_published == True)  # noqa
            .group_by(Model.id)
            .order_by(db.sql.func.avg(Score.perf).desc())
            .limit(n)
            .offset(offset * n)
            .subquery()
        )

        return (
            self.dbs.query(
                sub_query.c.m_id,
                sub_query.c.name,
                Score.perf.label("avg_perg"),
                Round.rid,
            )
            .join(Score, Round.id == Score.r_realid)
            .filter(Score.mid == sub_query.c.m_id)
        )

    def getByMid(self, mid):
        return (
            self.dbs.query(Score.perf, Round.rid)
            .join(Round, Round.id == Score.r_realid, isouter=True)
            .filter(Score.mid == mid)
            .all()
        )
