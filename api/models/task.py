import sqlalchemy as db
from .base import Base, BaseModel

class Task(Base):
    __tablename__ = 'tasks'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    shortname = db.Column(db.String(length=255), nullable=False, unique=True)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)
    targets = db.Column(db.Text) # ordered list of target labels
    score_progression = db.Column(db.Text) # ordered list of max scores per round

    total_verified = db.Column(db.Integer, default=0)
    total_collected = db.Column(db.Integer, default=0)
    last_updated = db.Column(db.DateTime)

    #cur_round = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    cur_round = db.Column(db.Integer, nullable=False)

    has_context = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return '<Task {}>'.format(self.name)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = str(getattr(self, column.name))
        return d

class TaskModel(BaseModel):
    def __init__(self):
        super(TaskModel, self).__init__(Task)
    def getByShortName(self, shortname):
        try:
            return self.dbs.query(Task).filter(Task.shortname == shortname).one()
        except db.orm.exc.NoResultFound:
            return False
