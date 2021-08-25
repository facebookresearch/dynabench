# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db

from .base import Base, BaseModel


class Round(Base):
    __tablename__ = "rounds"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    task = db.orm.relationship("Task", foreign_keys="Round.tid")

    rid = db.Column(db.Integer, default=1, nullable=False, index=True)

    secret = db.Column(db.String(length=255), nullable=False)
    url = db.Column(db.String(length=255), nullable=False)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)

    total_fooled = db.Column(db.Integer, default=0)
    total_verified_fooled = db.Column(db.Integer, default=0)
    total_collected = db.Column(db.Integer, default=0)
    total_time_spent = db.Column(db.Time, default=0)

    start_datetime = db.Column(db.DateTime, nullable=True)
    end_datetime = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Round {self.tid} {self.rid}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            if safe and column.name in ["secret"]:
                continue
            d[column.name] = getattr(self, column.name)
        return d


class RoundModel(BaseModel):
    def __init__(self):
        super().__init__(Round)

    def getByTidAndRid(self, tid, rid):
        try:
            return (
                self.dbs.query(Round)
                .filter(Round.tid == tid)
                .filter(Round.rid == rid)
                .one()
            )  # should be unique
        except db.orm.exc.NoResultFound:
            return False

    def getByTid(self, tid):
        try:
            return self.dbs.query(Round).filter(Round.tid == tid).all()
        except db.orm.exc.NoResultFound:
            return False

    def incrementCollectedCount(self, tid, rid):
        r = self.getByTidAndRid(tid, rid)
        if r:
            prev = r.total_collected
            if prev is None:
                prev = 0
            r.total_collected = prev + 1
            r.task.last_updated = db.sql.func.now()
            self.dbs.commit()

    def incrementFooledCount(self, r_realid):
        r = self.get(r_realid)
        if r:
            prev = r.total_fooled
            if prev is None:
                prev = 0
            r.total_fooled = prev + 1
            self.dbs.commit()

    def incrementVerifiedFooledCount(self, r_realid):
        r = self.get(r_realid)
        if r:
            prev = r.total_verified_fooled
            if prev is None:
                prev = 0
            r.total_verified_fooled = prev + 1
            self.dbs.commit()

    def updateLastActivity(self, r_realid):
        r = self.get(r_realid)
        if r:
            r.task.last_updated = db.sql.func.now()
            self.dbs.commit()
