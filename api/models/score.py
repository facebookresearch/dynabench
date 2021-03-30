# Copyright (c) Facebook, Inc. and its affiliates.

import json
import math

import pandas as pd
import sqlalchemy as db

from common import helpers as util
from models.dataset import Dataset
from models.round import Round
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
    did = db.Column(db.Integer, db.ForeignKey("datasets.id"), nullable=False)

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
    seconds_per_example = db.Column(db.Float)

    fairness = db.Column(db.Float)
    robustness = db.Column(db.Float)

    # TODO: make all of these go from 0 onwards

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

    def update(self, id, **kwargs):
        u = self.dbs.query(Score).filter(Score.id == id)
        u.update(kwargs)
        self.dbs.commit()

    def bulk_create(self, model_id, score_objs=[], raw_upload_data=""):
        self.dbs.add_all(
            [
                Score(
                    r_realid=score_obj["r_realid"],
                    mid=model_id,
                    did=score_obj["did"],
                    desc=score_obj.get("desc", None),
                    longdesc=score_obj.get("longdesc", None),
                    pretty_perf=score_obj["pretty_perf"],
                    perf=score_obj["perf"],
                    raw_upload_data=raw_upload_data,
                    eval_id_start=score_obj.get("start_index", -1),
                    eval_id_end=score_obj.get("end_index", -1),
                    metadata_json=score_obj["metadata_json"],
                    memory_utilization=score_obj.get("memory_utilization", None),
                    examples_per_second=score_obj.get("examples_per_second", None),
                )
                for score_obj in score_objs
            ]
        )
        return self.dbs.commit()

    # calculate the dynascore
    # normalization is automatically done via AMRS
    # e.g., raw FLOPs are on the scale of 10e7 but the AMRS-converted compute is in
    # [0,100]
    def dynascore(self, perf_metric_field_name, data, weights):
        converted_data = data.copy(deep=True)
        converted_data["dynascore"] = 0

        denominator = sum(weights.values())
        for key in weights:
            weights[key] /= denominator

        delta = data.diff()

        for metric in list(data):
            AMRS = (1 if metric == perf_metric_field_name else -1) * (
                delta[metric] / delta[perf_metric_field_name]
            ).mean(skipna=True)
            converted_data[metric] = data[metric] / AMRS
            converted_data["dynascore"] += converted_data[metric] * weights.get(
                metric, 0
            )

        return converted_data

    def getDynaboardByTask(
        self,
        tid,
        perf_metric_field_name,
        ordered_metrics_with_weight_and_conversion,
        ordered_dids_with_weight,
        sort_by="dynascore",
        reverse_sort=False,
        limit=5,
        offset=0,
    ):

        datasets = self.dbs.query(Dataset).filter(
            Dataset.id.in_([item["did"] for item in ordered_dids_with_weight])
        )
        models = (
            self.dbs.query(Model).filter(Model.tid == tid).filter(Model.is_published)
        )
        scores = (
            self.dbs.query(Score)
            .join(Model, Score.mid == Model.id)
            .filter(Model.tid == tid)
            .filter(Model.is_published)
        )
        mid_and_did_to_scores = {}
        for score in scores:
            mid_and_did_to_scores[(score.mid, score.did)] = score

        dataset_results_dict = {}
        for dataset in datasets:
            dataset_results_dict[dataset.id] = {
                item["field_name"]: []
                for item in ordered_metrics_with_weight_and_conversion
            }
            for model in models:
                if (model.id, dataset.id) in mid_and_did_to_scores:
                    score = mid_and_did_to_scores[(model.id, dataset.id)]
                    for field_name in dataset_results_dict[dataset.id]:
                        if field_name == perf_metric_field_name:
                            dataset_results_dict[dataset.id][field_name].append(
                                score.perf
                            )
                        elif (
                            field_name in score.to_dict()
                            and score.to_dict()[field_name] is not None
                        ):
                            dataset_results_dict[dataset.id][field_name].append(
                                score.to_dict()[field_name]
                            )
                        elif (
                            score.metadata_json is not None
                            and field_name in json.loads(score.metadata_json)
                            and json.loads(score.metadata_json)[field_name] is not None
                        ):
                            dataset_results_dict[dataset.id][field_name].append(
                                json.loads(score.metadata_json)[field_name]
                            )
                        else:
                            dataset_results_dict[dataset.id][field_name].append(
                                0.0
                            )  # We assume that 0 is the null score
                            # (perfect for cost metrics, but worst for performance)
                else:
                    for field_name in dataset_results_dict[dataset.id]:
                        dataset_results_dict[dataset.id][field_name].append(
                            0.0
                        )  # We assume that 0 is the null scor
                        # (perfect for cost metrics, but worst for performance)
        averaged_dataset_results = None
        positive_utility_conversions = {
            item["field_name"]: item["positive_utility_conversion"]
            for item in ordered_metrics_with_weight_and_conversion
        }
        for key, value in dataset_results_dict.items():
            df = pd.DataFrame.from_dict(value)
            dataset_results_dict[key] = df
            for metric in positive_utility_conversions:
                df[metric] = positive_utility_conversions[metric](df[metric])
            if averaged_dataset_results is None:
                averaged_dataset_results = {
                    item["did"]: item["weight"] for item in ordered_dids_with_weight
                }[key] * df
            else:
                averaged_dataset_results += {
                    item["did"]: item["weight"] for item in ordered_dids_with_weight
                }[key] * df
        converted_dataset_results = self.dynascore(
            perf_metric_field_name,
            averaged_dataset_results,
            weights={
                item["field_name"]: item["weight"]
                for item in ordered_metrics_with_weight_and_conversion
            },
        )

        users = self.dbs.query(User)
        uid_to_username = {}
        for user in users:
            uid_to_username[user.id] = user.username
        data_list = []
        model_index = 0
        for model in models:
            datasets_list = []
            for dataset in datasets:
                scores = []
                for field_name in [
                    item["field_name"]
                    for item in ordered_metrics_with_weight_and_conversion
                ]:
                    scores.append(
                        dataset_results_dict[dataset.id][field_name][model_index]
                    )
                variances = [0] * len(scores)  # TODO
                datasets_list.append(
                    {
                        "id": dataset.id,
                        "name": dataset.name,
                        "scores": scores,
                        "variances": variances,
                    }
                )
            averaged_scores = []
            for field_name in [
                item["field_name"]
                for item in ordered_metrics_with_weight_and_conversion
            ]:
                averaged_scores.append(
                    averaged_dataset_results[field_name][model_index]
                )
            averaged_variances = [0] * len(averaged_scores)  # TODO
            dynascore = converted_dataset_results["dynascore"][model_index]
            data_list.append(
                {
                    "model_id": model.id,
                    "model_name": model.name,
                    "uid": model.uid,
                    "username": uid_to_username[model.uid],
                    "averaged_scores": averaged_scores,
                    "averaged_variances": averaged_variances,
                    "dynascore": dynascore
                    if not math.isnan(dynascore)
                    else 0,  # It is possible for the dynascore to be nan if,
                    # for any metric, all models on the leaderboard have tha
                    # metric as 0.
                    "dynavariance": 0,  # TODO
                    "datasets": datasets_list,
                }
            )
            model_index += 1

        if sort_by == "dynascore":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["dynascore"])
        elif sort_by in [
            m_item["pretty_name"]
            for m_item in ordered_metrics_with_weight_and_conversion
        ]:
            data_list.sort(
                reverse=reverse_sort,
                key=lambda model: model["averaged_scores"][
                    [
                        m_item["pretty_name"]
                        for m_item in ordered_metrics_with_weight_and_conversion
                    ].index(sort_by)
                ],
            )
        elif sort_by == "model_name":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["model_name"])

        print(data_list[offset : offset + limit])
        return util.json_encode(
            {"count": len(data_list), "data": data_list[offset : offset + limit]}
        )

    def getByTid(self, tid):
        # Main query to fetch the model details
        query_res = (
            self.dbs.query(Score)
            .join(Model, Score.mid == Model.id)
            .filter(Model.tid == tid)
        )
        return query_res

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

    # FIXME: Ideally scores table should be deduped by (mid, did)
    # but all previous evaluations prior to datasets table will have
    # did = 0 and adding this now will cause prod server failure.
    # We should add did to scores table and add the dedup constraint
    # once new datasets are uploaded to eval server.
    def getOneByModelIdAndDataset(self, mid, did):
        try:
            return (
                self.dbs.query(Score)
                .join(Model)
                .filter(Score.mid == mid)
                .filter(Score.did == did)
                .order_by(Score.perf.desc())
                .one()
            )
        except db.orm.exc.NoResultFound:
            return False

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
