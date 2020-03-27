import sqlalchemy as db
from .base import Base, dbs, BaseModel

class Model(Base):
    __tablename__ = 'models'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    name = db.Column(db.String(length=255), nullable=False)
    shortname = db.Column(db.String(length=255), nullable=False)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)
    papers = db.Column(db.Text)

    overall_perf = db.Column(db.Text)

    def __repr__(self):
        return '<Model {}>'.format(self.id)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = str(getattr(self, column.name))
        return d

class ModelModel(BaseModel):
    def __init__(self):
        super(ModelModel, self).__init__(Model)

    #def get(self, id):
    #    return dbs.query(Model).filter(Model.id == id).one()
    def getByTid(self, tid):
        return dbs.query(Model).filter(Model.tid == tid).all()
