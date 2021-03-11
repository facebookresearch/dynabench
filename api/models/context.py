# Copyright (c) Facebook, Inc. and its affiliates.

import sqlalchemy as db

from .base import Base, BaseModel


class Context(Base):
    __tablename__ = "contexts"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    r_realid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Context.r_realid")

    context = db.Column(db.Text)

    tag = db.Column(db.Text)

    metadata_json = db.Column(db.Text)  # e.g. source, or whatever

    total_used = db.Column(db.Integer, default=0)

    last_used = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Context {self.context}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class ContextModel(BaseModel):
    def __init__(self):
        super().__init__(Context)

    def getRandom(self, rid, n=1, tags=None):
        # https://stackoverflow.com/questions/60805/getting-random-row-through-sqlalchemy
        # return dbs.query(Context).filter(Context.tid == tid).filter(
        #       Context.rid == rid).options(db.orm.load_only('id')).offset(
        #        db.sql.func.floor(
        #            db.sql.func.random() *
        #            dbs.query(db.sql.func.count(Context.id))
        #        )
        #    ).limit(n).all()

        result = self.dbs.query(Context)

        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        return (
            result.filter(Context.r_realid == rid)
            .order_by(db.sql.func.rand())
            .limit(n)
            .all()
        )

    def getRandomMin(self, rid, n=1, tags=None):
        result = self.dbs.query(Context)

        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        return (
            result.filter(Context.r_realid == rid)
            .order_by(Context.total_used.asc(), db.sql.func.rand())
            .limit(n)
            .all()
        )

    def getRandomLeastFooled(self, rid, n=1, tags=None):
        from models.example import Example

        result = self.dbs.query(Context).filter(Context.r_realid == rid)
        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        example_sub_query = (
            self.dbs.query(Example.cid, db.sql.func.sum(Example.model_wrong))
            .group_by(Example.cid)
            .order_by(db.sql.func.sum(Example.model_wrong).asc(), db.sql.func.rand())
            .subquery()
        )

        return (
            result.join(example_sub_query, Context.id == example_sub_query.c.cid)
            .limit(n)
            .all()
        )

    def incrementCountDate(self, cid):
        c = self.get(cid)
        if c:
            c.total_used = (c.total_used + 1) if c.total_used is not None else 1
            c.last_used = db.sql.func.now()
            self.dbs.commit()
