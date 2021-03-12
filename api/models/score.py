# Copyright (c) Facebook, Inc. and its affiliates.

import json

import sqlalchemy as db

from common import helpers as util
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
    rid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Score.rid")
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

    def create(self, round_id, model_id, **kwargs):
        m = Score(rid=round_id, mid=model_id, **kwargs)
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
                    rid=score_obj["round_id"],
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

    def getOverallPerfByTask(self, tid, n=5):
        try:
            return (
                self.dbs.query(Score.id, db.sql.func.avg(Score.perf).label("avg_perf"))
                .filter(Score.tid == tid)
                .group_by(Score.rid)
                .order_by(db.sql.func.avg(Score.perf).desc())
                .limit(n)
            )
        # TODO: Join model
        except db.orm.exc.NoResultFound:
            return False

    def getByTaskAndRound(self, tid, rid):
        try:
            return (
                self.dbs.query(Score)
                .join(Model)
                .filter(Score.tid == tid)
                .filter(Score.rid == rid)
                .order_by(Score.perf.desc())
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getByModelIdAndDataset(self, mid, did):
        try:
            return (
                self.dbs.query(Score)
                .join(Model)
                .filter(Score.mid == mid)
                .filter(Score.did == did)
                .order_by(Score.perf.desc())
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getByTaskAndModelIds(self, tid, mids):
        """ For getting e.g. scores of the top N models """
        assert isinstance(mids, list)
        try:
            return (
                self.dbs.query(Score)
                .filter(Score.tid == tid)
                .filter(Score.id.in_(mids))
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

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
            .join(Round, Round.id == Score.rid, isouter=True)
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
            .join(Score, Round.id == Score.rid)
            .filter(Score.mid == sub_query.c.m_id)
        )

    def getByMid(self, mid):
        return (
            self.dbs.query(Score.perf, Round.rid)
            .join(Round, Round.id == Score.rid, isouter=True)
            .filter(Score.mid == mid)
            .all()
        )
