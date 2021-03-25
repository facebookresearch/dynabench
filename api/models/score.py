# Copyright (c) Facebook, Inc. and its affiliates.

import json

import numpy as np
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

    def getDynaboardByTask(
        self,
        tid,
        ordered_metrics_with_weight_and_range,
        ordered_dids_with_weight,
        sort_by="dynascore",
        reverse_sort=False,
        limit=5,
        offset=0,
    ):

        data = {}

        models = (
            self.dbs.query(Model).filter(Model.tid == tid).filter(Model.is_published)
        )
        for model in models:
            data[model.id] = {}
            for d_item in ordered_dids_with_weight:
                data[model.id][d_item["did"]] = np.array(
                    [
                        m_item["range"][0]
                        for m_item in ordered_metrics_with_weight_and_range
                    ]
                )

        scores = (
            self.dbs.query(Score)
            .join(Model, Score.mid == Model.id)
            .filter(Model.tid == tid)
            .filter(Model.is_published)
        )

        for score in scores:
            data[score.mid][score.did] = [
                score.to_dict().get(
                    m_item["field_name"],
                    json.loads(score.metadata_json).get(m_item["field_name"], 0) / 100,
                )
                for m_item in ordered_metrics_with_weight_and_range
            ]  # TODO should there be 0's if we cant find a field?
            data[score.mid][score.did] = np.array(
                [item if item is not None else 0 for item in data[score.mid][score.did]]
            )

        M = np.array(
            [
                [data[m][d] for d in [item["did"] for item in ordered_dids_with_weight]]
                for m in [model.id for model in models]
            ]
        )

        def normalize_data(data):
            # Q: should we normalize everything to [0,1] or just to utility
            # (i.e., anything where higher=better)?
            # Q: what is the best way to normalize compute and mem?
            # Q: what is the best way to normalize fairness/robustness delta?
            # Q: should we or should we not center (i.e. zero-mean) the data when done?
            # Proposal: hard-cap at X as worst, with 0 as best? (no strong opinion)
            ordered_field_names = [
                m_item["field_name"] for m_item in ordered_metrics_with_weight_and_range
            ]

            # 2 - compute: inverted clip-normalized score
            if "seconds_per_example" in ordered_field_names:
                index = ordered_field_names.index("seconds_per_example")
                compute_cap = ordered_metrics_with_weight_and_range[index]["range"][
                    1
                ]  # this should be a big enough number
                M[:, :, index] = (
                    1 - np.clip(M[:, :, index], 0, compute_cap) / compute_cap
                )

            # 3 - memory: inverted clip-normalized score
            if "memory_utilization" in ordered_field_names:
                index = ordered_field_names.index("memory_utilization")
                memory_cap = ordered_metrics_with_weight_and_range[index]["range"][
                    1
                ]  # this should be a big enough number (this comes from the machine)
                M[:, :, index] = 1 - np.clip(M[:, :, index], 0, memory_cap) / memory_cap

            # 4/5 - fairness and robustness: clip-normalized absolute score
            if "fairness" in ordered_field_names:
                index = ordered_field_names.index("fairness")
                fairness_cap = ordered_metrics_with_weight_and_range[index]["range"][1]
                M[:, :, index] = (
                    np.clip(np.abs(M[:, :, index]), 0, fairness_cap) / fairness_cap
                )

            if "robustness" in ordered_field_names:
                index = ordered_field_names.index("robustness")
                robustness_cap = ordered_metrics_with_weight_and_range[index]["range"][
                    1
                ]
                M[:, :, index] = (
                    np.clip(np.abs(M[:, :, index]), 0, robustness_cap) / robustness_cap
                )

            assert M.max() <= 1 and M.min() >= 0
            return M

        M = normalize_data(M)

        def apply_weights(M):
            # Q: since we are only normalized on scale, should we first center
            # on the means, before we apply weights?
            dataset_weights = np.array(
                [item["weight"] for item in ordered_dids_with_weight]
            )
            W = np.dot(M.transpose(0, 2, 1), dataset_weights)
            return W

        W = apply_weights(M)

        def dynascore(W):
            metric_weights = np.array(
                [item["weight"] for item in ordered_metrics_with_weight_and_range]
            )
            # simple weighted aggregation:
            S = np.dot(W, metric_weights.T)
            # TODO: Replace this with MRS-based version
            # Kawin?
            return S

        S = dynascore(W)

        users = self.dbs.query(User)
        uid_to_username = {}
        for user in users:
            uid_to_username[user.id] = user.username

        datasets = self.dbs.query(Dataset)
        did_to_name = {}
        for dataset in datasets:
            did_to_name[dataset.id] = dataset.name

        data_list = []
        model_index = 0
        for model in models:
            datasets = []
            dataset_index = 0
            for _ in M[model_index]:
                datasets.append(
                    {
                        "id": ordered_dids_with_weight[dataset_index]["did"],
                        "name": did_to_name[
                            ordered_dids_with_weight[dataset_index]["did"]
                        ],
                        "scores": M[model_index][dataset_index].tolist(),
                        "variances": [0] * len(M[model_index][dataset_index].tolist()),
                    }
                )
                dataset_index += 1
            data_list.append(
                {
                    "model_id": model.id,
                    "model_name": model.name,
                    "uid": model.uid,
                    "username": uid_to_username[model.uid],
                    "averaged_scores": W[model_index].tolist(),
                    "averaged_variances": [0] * len(W[model_index].tolist()),
                    "dynascore": float(S[model_index]),
                    "dynavariance": 0,
                    "datasets": datasets,
                }
            )
            model_index += 1

        if sort_by == "dynascore":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["dynascore"])
        elif sort_by in [
            m_item["pretty_name"] for m_item in ordered_metrics_with_weight_and_range
        ]:
            data_list.sort(
                reverse=reverse_sort,
                key=lambda model: model["averaged_scores"][
                    [
                        m_item["pretty_name"]
                        for m_item in ordered_metrics_with_weight_and_range
                    ].index(sort_by)
                ],
            )
        elif sort_by == "model_name":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["model_name"])

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
