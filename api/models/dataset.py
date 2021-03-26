# Copyright (c) Facebook, Inc. and its affiliates.

import enum

import sqlalchemy as db

from .base import Base, BaseModel


class AccessTypeEnum(enum.Enum):
    scoring = "scoring"
    standard = "standard"
    hidden = "hidden"


class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    rid = db.Column(db.Integer, default=0)

    desc = db.Column(db.String(length=255))
    access_type = db.Column(db.Enum(AccessTypeEnum), default=AccessTypeEnum.scoring)

    def __repr__(self):
        return f"<Dataset {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class DatasetModel(BaseModel):
    def __init__(self):
        super().__init__(Dataset)

    def create(self, name, task_id, **kwargs):
        try:
            d = Dataset(name=name, tid=task_id, **kwargs)
            self.dbs.add(d)
            self.dbs.flush()
            self.dbs.commit()
            return d
        except db.exc.IntegrityError:
            self.dbs.rollback()
            return False
        except db.exc.InvalidRequestError:
            self.dbs.rollback()
            return False

    def delete(self, dataset):
        self.dbs.delete(dataset)
        self.dbs.commit()
        return True

    def getByTid(self, task_id):
        try:
            return self.dbs.query(Dataset).filter(Dataset.tid == task_id).all()
        except db.orm.exc.NoResultFound:
            return False

    def getByName(self, name):
        try:
            return self.dbs.query(Dataset).filter(Dataset.name == name).one()
        except db.orm.exc.NoResultFound:
            return False
