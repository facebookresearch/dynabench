import sqlalchemy as db
from .base import Base, BaseModel
from .round import Round

class Task(Base):
    __tablename__ = 'tasks'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    shortname = db.Column(db.String(length=255), nullable=False, unique=True)

    # Task type is either 'clf' or 'extract' for now
    type = db.Column(db.String(length=255), nullable=False, default='clf')

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)
    targets = db.Column(db.Text) # ordered list of target labels
    score_progression = db.Column(db.Text) # ordered list of max scores per round

    total_verified = db.Column(db.Integer, default=0)
    total_collected = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime)

    #cur_round = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=False)

    has_context = db.Column(db.Boolean, default=True)
    has_answer = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return '<Task {}>'.format(self.name)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

class TaskModel(BaseModel):
    def __init__(self):
        super(TaskModel, self).__init__(Task)
    def getByShortName(self, shortname):
        try:
            return self.dbs.query(Task).filter(Task.shortname == shortname).one()
        except db.orm.exc.NoResultFound:
            return False
    def listWithRounds(self, exclude_hidden=True):
        rows = self.dbs.query(Task, Round).join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
        if exclude_hidden:
            rows = rows.filter(Task.hidden.is_(False))
        rows = rows.all()
        tasks = [x[0].to_dict() for x in rows]
        for ii, r in enumerate([x[1] for x in rows]):
            tasks[ii]['round'] = r.to_dict()
        return tasks
    def getWithRound(self, tid):
        try:
            t, r = self.dbs.query(Task, Round).filter(Task.id == tid).join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round)).one()
            t = t.to_dict()
            t['round'] = r.to_dict()
            return t
        except db.orm.exc.NoResultFound:
            return False

