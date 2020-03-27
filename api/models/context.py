import sqlalchemy as db
from .base import Base, dbs, BaseModel

class Context(Base):
    __tablename__ = 'contexts'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    task = db.orm.relationship("Task", foreign_keys="Context.tid")
    rid = db.Column(db.Integer, db.ForeignKey("rounds.rid"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Context.rid")

    context = db.Column(db.Text)

    tags = db.Column(db.Text) # e.g. source, or whatever

    total_used = db.Column(db.Integer, default=0)

    last_used = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return '<Context {}>'.format(self.context)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = str(getattr(self, column.name))
        return d

class ContextModel(BaseModel):
    def __init__(self):
        super(ContextModel, self).__init__(Context)

    def getRandom(self, tid, rid, n=1):
        # https://stackoverflow.com/questions/60805/getting-random-row-through-sqlalchemy
        #return dbs.query(Context).filter(Context.tid == tid).filter(Context.rid == rid).options(db.orm.load_only('id')).offset(
        #        db.sql.func.floor(
        #            db.sql.func.random() *
        #            dbs.query(db.sql.func.count(Context.id))
        #        )
        #    ).limit(n).all()
        return dbs.query(Context).filter(Context.tid == tid).filter(Context.rid == rid).order_by(db.sql.func.rand()).limit(n).all()
