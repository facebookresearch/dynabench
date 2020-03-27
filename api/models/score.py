import sqlalchemy as db
from .base import Base, dbs, BaseModel

class Score(Base):
    __tablename__ = 'scores'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("models.id"), nullable=False)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    rid = db.Column(db.Integer, db.ForeignKey("rounds.rid"), nullable=False) # does this work?

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)

    pretty_perf = db.Column(db.String(length=255))
    perf = db.Column(db.Float(), default=0.0)

    def __repr__(self):
        return '<Score {}>'.format(self.id)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = str(getattr(self, column.name))
        return d

class ScoreModel(BaseModel):
    def __init__(self):
        super(ScoreModel, self).__init__(Score)
    def getOverallPerfByTask(self, tid, n=5):
        try:
            return dbs.query(Score.id,db.sql.func.avg(Score.perf).label('avg_perf')).filter(Score.tid == tid).group_by(Score.rid).order_by(db.sql.func.avg(Score.perf).desc()).limit(n)
        # TODO: Join model
        except db.orm.exc.NoResultFound:
            return False
    def getByTaskAndRound(self, tid, rid):
        try:
            return dbs.query(Score).join(Model).filter(Score.tid == tid).filter(Score.rid == rid).order_by(Score.perf.desc()).all()
        except db.orm.exc.NoResultFound:
            return False
    def getByTaskAndModelIds(self, tid, mids):
        """ For getting e.g. scores of the top N models """
        assert isinstance(mids, list)
        try:
            return dbs.query(Score).filter(Score.tid == tid).filter(Score.id.in_(mids)).all()
        except db.orm.exc.NoResultFound:
            return False
