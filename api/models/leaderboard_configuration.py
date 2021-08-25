# Copyright (c) Facebook, Inc. and its affiliates.

import datetime

import sqlalchemy as db

from common import helpers as util

from .base import Base, BaseModel


class LeaderboardConfiguration(Base):
    __tablename__ = "leaderboard_configurations"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), primary_key=True)
    name = db.Column(db.String(length=255), primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    desc = db.Column(db.Text)
    create_datetime = db.Column(db.DateTime)
    configuration_json = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f"<LeaderboardConfiguration name {self.name} tid {self.tid}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class LeaderboardConfigurationModel(BaseModel):
    def __init__(self):
        super().__init__(LeaderboardConfiguration)

    def create(self, tid, name, user_id, **kwargs):
        lc = LeaderboardConfiguration(
            tid=tid,
            name=name,
            uid=user_id,
            create_datetime=datetime.datetime.utcnow(),
            **kwargs,
        )
        self.dbs.add(lc)
        self.dbs.commit()
        return lc

    def getByTaskIdAndLeaderboardName(self, tid, name):
        try:
            return (
                self.dbs.query(LeaderboardConfiguration)
                .filter(LeaderboardConfiguration.tid == tid)
                .filter(LeaderboardConfiguration.name == name)
                .one()
            )
        except db.orm.exc.NoResultFound:
            return False

    def exists(self, tid, name):
        return (
            self.dbs.query(LeaderboardConfiguration.name)
            .filter_by(tid=tid, name=name)
            .scalar()
            is not None
        )

    def getUserForksByUid(self, uid, limit=5, offset=0):
        query_res = self.dbs.query(LeaderboardConfiguration).filter(
            LeaderboardConfiguration.uid == uid
        )
        return (
            query_res.limit(limit).offset(offset * limit),
            util.get_query_count(query_res),
        )
