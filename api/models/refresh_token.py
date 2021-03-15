# Copyright (c) Facebook, Inc. and its affiliates.

import datetime

import sqlalchemy as db

from .base import Base, BaseModel


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(length=255), nullable=False, unique=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    generated_datetime = db.Column(db.DateTime)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class RefreshTokenModel(BaseModel):
    def __init__(self):
        super().__init__(RefreshToken)

    def create(self, uid, token):
        rt = RefreshToken(
            uid=uid, token=token, generated_datetime=datetime.datetime.utcnow()
        )
        self.dbs.add(rt)
        return self.dbs.commit()

    def getByToken(self, token):
        try:
            return (
                self.dbs.query(RefreshToken).filter(RefreshToken.token == token).one()
            )
        except db.orm.exc.NoResultFound:
            return False

    def deleteByToken(self, token):
        rt = self.getByToken(token)
        if rt:
            self.dbs.delete(rt)
            return self.dbs.commit()
        else:
            return False

    def removeTokensOlderThanMonth(self):
        one_month_ago = datetime.datetime.utcnow() - datetime.timedelta(weeks=4)
        self.dbs.query(RefreshToken).filter(
            RefreshToken.generated_datetime < one_month_ago
        ).delete()
        self.dbs.commit()
        print("Removed old tokens")
