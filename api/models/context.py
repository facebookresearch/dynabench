# Copyright (c) Facebook, Inc. and its affiliates.

import sqlalchemy as db
from sqlalchemy import case

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

    def getRandomLeastFooled(self, rid, num_matching_validations, n=1, tags=None):
        from models.example import Example
        from models.validation import Validation, LabelEnum

        result = self.dbs.query(Context).filter(Context.r_realid == rid)
        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        cnt_correct_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.correct, 1)], else_=0)
        ).label("cnt_correct_val")
        cnt_incorrect_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.incorrect, 1)], else_=0)
        ).label("cnt_incorrect_val")
        cnt_flagged_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.flagged, 1)], else_=0)
        ).label("cnt_flagged_val")

        least_validated_fooled_examples = (
            result.join(Example, Context.id == Example.cid)
            .join(Validation, Example.id == Validation.eid)
            .group_by(Example.cid)
            .having(
                db.and_(
                    cnt_correct_val < num_matching_validations,
                    db.or_(
                        cnt_incorrect_val >= num_matching_validations,
                        cnt_flagged_val >= num_matching_validations,
                    ),
                )
            )
            .order_by(db.sql.func.rand())
            .limit(n)
        )

        if len(least_validated_fooled_examples.all()) == n:
            return least_validated_fooled_examples.all()

        least_fooled_examples_sub_query = (
            self.dbs.query(
                Example.cid,
                db.sql.func.sum(
                    db.case(value=Example.model_wrong, whens={1: 1}, else_=0)
                ).label("num_fooled"),
            )
            .group_by(Example.cid)
            .subquery()
        )
        least_fooled_examples = (
            result.join(
                least_fooled_examples_sub_query,
                Context.id == least_fooled_examples_sub_query.c.cid,
                isouter=True,
            )
            .filter(
                db.not_(
                    db.exists().where(
                        least_validated_fooled_examples.subquery().c.id == Context.id
                    )
                )
            )
            .order_by(
                least_fooled_examples_sub_query.c.num_fooled.asc(), db.sql.func.rand()
            )
            .limit(n - len(least_validated_fooled_examples.all()))
        )

        return least_validated_fooled_examples.all() + least_fooled_examples.all()

    def incrementCountDate(self, cid):
        c = self.get(cid)
        if c:
            c.total_used = (c.total_used + 1) if c.total_used is not None else 1
            c.last_used = db.sql.func.now()
            self.dbs.commit()
