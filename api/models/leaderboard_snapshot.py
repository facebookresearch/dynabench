import datetime

import sqlalchemy as db

from common import helpers as util
from models.user import User

from .base import Base, BaseModel


class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    desc = db.Column(db.Text)
    create_datetime = db.Column(db.DateTime)
    data_json = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f"<LeaderboardSnapshot id {self.id} tid {self.tid} uid {self.uid}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class LeaderboardSnapshotModel(BaseModel):
    def __init__(self):
        super().__init__(LeaderboardSnapshot)

    def create(self, tid, uid, **kwargs):
        ls = LeaderboardSnapshot(
            tid=tid, uid=uid, create_datetime=datetime.datetime.utcnow(), **kwargs
        )
        self.dbs.add(ls)
        self.dbs.commit()
        return ls

    def getWithCreatorData(self, sid):
        try:
            return (
                self.dbs.query(LeaderboardSnapshot, User)
                .join(User, User.id == LeaderboardSnapshot.uid)
                .filter(LeaderboardSnapshot.id == sid)
                .one()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getUserSnapshotsByUid(self, uid, limit=5, offset=0):
        query_res = self.dbs.query(LeaderboardSnapshot).filter(
            LeaderboardSnapshot.uid == uid
        )
        return query_res.limit(limit).offset(offset * limit), util.get_query_count(
            query_res
        )
