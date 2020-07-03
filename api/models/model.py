import sqlalchemy as db
from .base import Base, BaseModel

class Model(Base):
    __tablename__ = 'models'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    task = db.orm.relationship("Task", foreign_keys="Model.tid")
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.orm.relationship("User", foreign_keys="Model.uid")

    name = db.Column(db.String(length=255), nullable=False)
    shortname = db.Column(db.String(length=255), nullable=False)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)
    papers = db.Column(db.Text)

    overall_perf = db.Column(db.Text)

    is_published = db.Column(db.BOOLEAN, default=False)

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

    def create(self, task_id, user_id, **kwargs):
        m = Model(tid=task_id, uid=user_id, **kwargs)
        self.dbs.add(m)
        self.dbs.flush()
        self.dbs.commit()
        return m

    def delete(self, model):
        self.dbs.delete(model)
        self.dbs.commit()
        return True

    def update(self, id, **kwargs):
        u = self.dbs.query(Model).filter(Model.id == id)
        u.update(kwargs)
        self.dbs.commit()

    def getUnpublishedModelByMid(self, id):
        # Model owner to fetch by id
       return self.dbs.query(Model).filter(Model.id == id).one()

    def get(self, id):
       return self.dbs.query(Model).filter(Model.id == id).filter(Model.is_published == True).one()

    def getByTid(self, tid):
        return self.dbs.query(Model).filter(Model.tid == tid).all()

    def getUserModelsByUid(self, uid, is_current_user=False, n=5, offset=0):
        if is_current_user:
            return self.dbs.query(Model).filter(Model.uid == uid).limit(n).offset(offset * n)
        else:
            return self.dbs.query(Model).filter(Model.uid == uid).filter(Model.is_published == True).\
                limit(n).offset(offset * n)

    def getUserModelsByUidAndMid(self, uid, mid, is_current_user=False):
        if is_current_user:
            return self.dbs.query(Model).filter(Model.uid == uid).filter(Model.id == mid).one()
        else:
            return self.dbs.query(Model).filter(Model.uid == uid).filter(Model.id == mid).\
                filter(Model.is_published == True).one()
