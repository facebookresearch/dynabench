import sqlalchemy as db
from .base import Base, BaseModel
from .model import Model

class Score(Base):
    __tablename__ = 'scores'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("models.id"), nullable=False)
    model = db.orm.relationship("Model", foreign_keys="Score.mid")
    rid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Score.rid")

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

    def create(self, round_id, model_id, **kwargs):
        m = Score(rid=round_id, mid=model_id, **kwargs)
        self.dbs.add(m)
        return self.dbs.commit()

    def bulk_create(self, model_id, score_objs=[]):
        self.dbs.add_all([
            Score(
                rid=score_obj['round_id'], mid=model_id, desc=score_obj['desc'],
                longdesc = score_obj['longdesc'], pretty_perf=score_obj['pretty_perf'], perf=score_obj['perf']
            )
            for score_obj in score_objs
        ])
        return self.dbs.commit()

    def getOverallPerfByTask(self, tid, n=5):
        try:
            return self.dbs.query(Score.id,db.sql.func.avg(Score.perf).label('avg_perf')).filter(Score.tid == tid).group_by(Score.rid).order_by(db.sql.func.avg(Score.perf).desc()).limit(n)
        # TODO: Join model
        except db.orm.exc.NoResultFound:
            return False
    def getByTaskAndRound(self, tid, rid):
        try:
            return self.dbs.query(Score).join(Model).filter(Score.tid == tid).filter(Score.rid == rid).order_by(Score.perf.desc()).all()
        except db.orm.exc.NoResultFound:
            return False
    def getByTaskAndModelIds(self, tid, mids):
        """ For getting e.g. scores of the top N models """
        assert isinstance(mids, list)
        try:
            return self.dbs.query(Score).filter(Score.tid == tid).filter(Score.id.in_(mids)).all()
        except db.orm.exc.NoResultFound:
            return False
