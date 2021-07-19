import datetime

import sqlalchemy as db

from .base import Base, BaseModel


class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), primary_key=True)
    name = db.Column(db.String(length=255), primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    create_datetime = db.Column(db.DateTime)
    data_json = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f"<LeaderboardSnapshot name {self.name} tid {self.tid}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class LeaderboardSnapshotModel(BaseModel):
    def __init__(self):
        super().__init__(LeaderboardSnapshot)

    def create(self, tid, name, user_id, data_json):
        lc = LeaderboardSnapshot(
            tid=tid,
            name=name,
            uid=user_id,
            create_datetime=datetime.datetime.utcnow(),
            data_json=data_json,
        )
        self.dbs.add(lc)
        self.dbs.commit()
        return lc

    def getByTaskIdAndLeaderboardName(self, tid, name):
        try:
            return (
                self.dbs.query(LeaderboardSnapshot)
                .filter(LeaderboardSnapshot.tid == tid)
                .filter(LeaderboardSnapshot.name == name)
                .one()
            )
        except db.orm.exc.NoResultFound:
            return False

    def exists(self, tid, name):
        return (
            self.dbs.query(LeaderboardSnapshot.name)
            .filter_by(tid=tid, name=name)
            .scalar()
            is not None
        )
