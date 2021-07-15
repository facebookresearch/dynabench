# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib
import json

import sqlalchemy as db
from sqlalchemy import JSON, case

import dynalab.tasks.hs
import dynalab.tasks.nli
import dynalab.tasks.qa
import dynalab.tasks.sentiment
from common.logging import logger
from models.context import Context
from models.model import Model
from models.round import Round
from models.validation import LabelEnum, ModeEnum, Validation

from .base import Base, BaseModel
from .context import ContextModel
from .task import TaskModel, model_correct_metrics
from .user import UserModel


class Example(Base):
    __tablename__ = "examples"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    cid = db.Column(db.Integer, db.ForeignKey("contexts.id"), nullable=False)
    context = db.orm.relationship("Context", foreign_keys="Example.cid")

    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user = db.orm.relationship("User", foreign_keys="Example.uid")
    tag = db.Column(db.Text)

    io = db.Column(db.Text)
    # why is X the label for this example
    example_explanation = db.Column(db.Text)
    # why do you think the model got it wrong
    model_explanation = db.Column(db.Text)

    metadata_json = db.Column(db.Text)

    model_response_io = db.Column(db.Text)
    model_endpoint_name = db.Column(db.Text)

    split = db.Column(db.String(length=255), default="undecided")

    model_wrong = db.Column(db.Boolean)
    retracted = db.Column(db.Boolean, default=False)
    flagged = db.Column(db.Boolean, default=False)

    generated_datetime = db.Column(db.DateTime)

    # time context shown - time example provided
    time_elapsed = db.Column(db.Time)

    total_verified = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<Example {self.id}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            if safe and column.name in ["split", "uid", "user"]:
                continue
            d[column.name] = getattr(self, column.name)
        d["context"] = self.context.to_dict()
        return d


class ExampleModel(BaseModel):
    def __init__(self):
        super().__init__(Example)

    def create(
        self,
        tid,
        rid,
        uid,
        cid,
        example_io,
        model_response_io,
        metadata,
        tag=None,
        model_endpoint_name=None,
    ):
        if uid == "turk" and "annotator_id" not in metadata:
            logger.error("Annotator id not specified but received Turk example")
            return False

        cm = ContextModel()
        c = cm.get(cid)
        if int(tid) != c.round.task.id or int(rid) != c.round.rid:
            logger.error(
                f"Task id ({tid}={c.round.task.id}) or round id"
                + f" ({rid}={c.round.rid}) do not match context"
            )
            return False

        tm = TaskModel()
        task = tm.get(tid)
        model_correct_metric = model_correct_metrics[task.model_correct_metric.name]
        output_keys = set(
            map(
                lambda item: item[0],
                filter(
                    lambda item: item[1]["location"] == "output",
                    json.loads(task.io_definition).items(),
                ),
            )
        )
        model_output = {}
        human_output = {}
        for key, value in example_io.items():
            if key in output_keys:
                human_output[key] = value
        for key, value in model_response_io.items():
            if key in output_keys:
                model_output[key] = value

        model_wrong = not model_correct_metric(model_output, human_output)

        if uid == "turk" and "model" in metadata and metadata["model"] == "no-model":
            pass  # ignore signature when we don't have a model in the loop with turkers
        else:
            if "signed" in model_response_io:
                if c.round.task.name == "Hate Speech":
                    dynalab_task = dynalab.tasks.hs
                elif c.round.task.name == "Natural Language Inference":
                    dynalab_task = dynalab.tasks.nli
                elif c.round.task.name == "Sentiment Analysis":
                    dynalab_task = dynalab.tasks.sentiment
                elif c.round.task.name == "Question Answering":
                    dynalab_task = dynalab.tasks.qa
                else:
                    logger.error(
                        "This is a Dynalab model but a Dynalab signature "
                        + "verification method has not been included for this task."
                    )
                    return False

                model_secret = (
                    self.dbs.query(Model)
                    .filter(Model.endpoint_name == model_endpoint_name)
                    .one()
                    .secret
                )
                if model_response_io[
                    "signed"
                ] != dynalab_task.TaskIO().generate_response_signature(
                    model_response_io, example_io, model_secret
                ):
                    logger.error(
                        "Signature does not match (received %s, expected %s)"
                        % (
                            model_response_io["signed"],
                            dynalab_task.TaskIO().generate_response_signature(
                                model_response_io, example_io, model_secret
                            ),
                        )
                    )
                    return False
                else:
                    logger.info(
                        "Signature matches(received %s, expected %s)"
                        % (
                            model_response_io["signed"],
                            dynalab_task.TaskIO().generate_response_signature(
                                model_response_io, example_io, model_secret
                            ),
                        )
                    )
            else:
                return False

        try:
            e = Example(
                context=c,
                io=json.dumps(example_io),
                model_wrong=model_wrong,
                model_response_io=json.dumps(model_response_io),
                generated_datetime=db.sql.func.now(),
                metadata_json=json.dumps(metadata),
                tag=tag,
            )

            # store uid/annotator_id
            if uid != "turk":
                um = UserModel()
                user = um.get(uid)
                e.user = user

            self.dbs.add(e)
            self.dbs.flush()
            self.dbs.commit()
            logger.info("Added example (%s)" % (e.id))
        except Exception as error_message:
            logger.error("Could not create example (%s)" % error_message)
            return False
        return e

    def get_anon_uid(self, secret, uid):
        anon_uid = hashlib.sha1()
        anon_uid.update(secret.encode("utf-8"))
        anon_uid.update(str(uid).encode("utf-8"))
        return anon_uid.hexdigest()

    def getByTid(self, tid):
        try:
            return (
                self.dbs.query(Example)
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == tid)
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getByTidAndRid(self, tid, rid):
        try:
            return (
                self.dbs.query(Example)
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == tid)
                .filter(Round.rid == rid)
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getByTidAndRidWithValidationIds(self, tid, rid):
        try:
            validations_query = (
                self.dbs.query(Example, db.func.group_concat(Validation.id))
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == tid)
                .filter(Round.rid == rid)
                .join(Validation, Validation.eid == Example.id)
                .group_by(Validation.eid)
            )
            no_validations_query = (
                self.dbs.query(Example, db.func.group_concat(""))
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == tid)
                .filter(Round.rid == rid)
                .filter(db.not_(db.exists().where(Validation.eid == Example.id)))
                .group_by(Example.id)
            )
            return validations_query.union(no_validations_query).all()
        except db.orm.exc.NoResultFound:
            return False

    def getRandom(
        self,
        rid,
        validate_non_fooling,
        num_matching_validations,
        n=1,
        my_uid=None,
        tags=None,
    ):
        cnt_correct = db.sql.func.sum(
            case([(Validation.label == LabelEnum.correct, 1)], else_=0)
        ).label("cnt_correct")
        cnt_flagged = db.sql.func.sum(
            case([(Validation.label == LabelEnum.flagged, 1)], else_=0)
        ).label("cnt_flagged")
        cnt_incorrect = db.sql.func.sum(
            case([(Validation.label == LabelEnum.incorrect, 1)], else_=0)
        ).label("cnt_incorrect")
        cnt_owner_validated = db.sql.func.sum(
            case([(Validation.mode == ModeEnum.owner, 1)], else_=0)
        ).label("cnt_owner_validated")
        result = (
            self.dbs.query(Example)
            .join(Context, Example.cid == Context.id)
            .filter(Context.r_realid == rid)
            .filter(Example.retracted == False)  # noqa
        )

        if tags:
            result = result.filter(Example.tag.in_(tags))  # noqa

        if not validate_non_fooling:
            result = result.filter(Example.model_wrong == True)  # noqa

        result_partially_validated = (
            result.join(Validation, Example.id == Validation.eid)
            .group_by(Validation.eid)
            .having(
                db.and_(
                    cnt_correct < num_matching_validations,
                    cnt_flagged < num_matching_validations,
                    cnt_incorrect < num_matching_validations,
                    cnt_owner_validated == 0,
                )
            )
        )
        if my_uid is not None:
            cnt_uid = db.sql.func.sum(
                case([(Validation.uid == my_uid, 1)], else_=0)
            ).label("cnt_uid")
            result_partially_validated = result_partially_validated.group_by(
                Validation.eid
            ).having(cnt_uid == 0)
        result_not_validated = result.filter(
            db.not_(db.exists().where(Validation.eid == Example.id))
        )
        result = result_partially_validated.union(result_not_validated)
        if my_uid is not None:
            result = result.filter(Example.uid != my_uid)
        result = (
            result.order_by(
                db.not_(Example.model_wrong),
                Example.total_verified.asc(),
                db.sql.func.rand(),
            )
            .limit(n)
            .all()
        )
        return result

    def getRandomVQA(
        self,
        rid,
        validate_non_fooling,
        num_matching_validations,
        n=1,
        mode="owner",
        my_uid=None,
        tags=None,
        context_tags=None,
    ):
        cnt_owner_validated = db.sql.func.sum(
            case([(Validation.mode == ModeEnum.owner, 1)], else_=0)
        ).label("cnt_owner_validated")

        if context_tags:
            result = (
                self.dbs.query(Example)
                .join(Context, Example.cid == Context.id)
                .filter(Context.r_realid == rid)
                .filter(Example.retracted == False)  # noqa
                .filter(Context.tag.in_(context_tags))
            )
        else:
            result = (
                self.dbs.query(Example)
                .join(Context, Example.cid == Context.id)
                .filter(Context.r_realid == rid)
                .filter(Example.retracted == False)  # noqa
            )

        if tags:
            result = result.filter(Example.tag.in_(tags))  # noqa

        if not validate_non_fooling:
            result = result.filter(Example.model_wrong == True)  # noqa

        cm = ContextModel()
        (
            contexts_with_example_stats,
            examples_with_validation_stats,
            # contexts stats:
            # how many examples passed, failed, inflight, pre-validation per context
            (
                cnt_correct_examples,
                cnt_failed_examples,
                cnt_inflight_examples,
                cnt_pre_val_examples,
            ),
            # example stats:
            # how many validations correct, incorrect, flagged, total per example
            (cnt_correct_val, cnt_incorrect_val, cnt_flagged_val, cnt_total_val),
        ) = cm.getContextValidationResults(
            num_matching_validations,
            validate_non_fooling=validate_non_fooling,
            example_tags=tags,
        )

        if my_uid is not None:
            if mode == "owner":
                cnt_uid = db.sql.func.sum(
                    case([(Validation.uid == my_uid, 1)], else_=0)
                ).label("cnt_uid")
            elif mode == "user":
                examples_with_validation_stats = examples_with_validation_stats.filter(
                    db.cast(Example.metadata_json, JSON)["annotator_id"] != my_uid
                )
                cnt_uid = db.sql.func.sum(
                    case(
                        [
                            (
                                db.cast(Validation.metadata_json, JSON)["annotator_id"]
                                == my_uid,
                                1,
                            )
                        ],
                        else_=0,
                    )
                ).label("cnt_uid")
            examples_with_validation_stats = examples_with_validation_stats.having(
                cnt_uid == 0
            )

        # partially validated
        examples_partially_validated = examples_with_validation_stats.having(
            db.and_(
                cnt_correct_val < num_matching_validations,
                cnt_flagged_val < num_matching_validations,
                cnt_incorrect_val < num_matching_validations,
                cnt_total_val > 0,
                cnt_owner_validated == 0,
            )
        )
        examples_partially_validated = examples_partially_validated.subquery()
        result_partially_validated = result.join(
            examples_partially_validated,
            examples_partially_validated.c.id == Example.id,
        )

        # not validated
        examples_not_validated = examples_with_validation_stats.having(
            db.and_(cnt_total_val == 0, cnt_owner_validated == 0)
        )
        examples_not_validated = examples_not_validated.subquery()
        contexts_with_example_stats = contexts_with_example_stats.having(
            cnt_correct_examples == 0
        )
        contexts_with_example_stats = contexts_with_example_stats.subquery()
        result_not_validated = result.join(
            contexts_with_example_stats,
            contexts_with_example_stats.c.cid == Example.cid,
        ).join(examples_not_validated, examples_not_validated.c.id == Example.id)

        result = result_partially_validated.union(result_not_validated)
        if my_uid is not None and mode == "owner":
            result = result.filter(Example.uid != my_uid)

        result = (
            result.order_by(
                db.not_(Example.model_wrong),
                Example.total_verified.asc(),
                db.sql.func.rand(),
            )
            .limit(n)
            .all()
        )
        return result

    def getRandomFiltered(
        self,
        rid,
        min_num_flags,
        max_num_flags,
        min_num_disagreements,
        max_num_disagreements,
        validate_non_fooling,
        n=1,
        tags=None,
    ):
        cnt_owner_validated = db.sql.func.sum(
            case([(Validation.mode == ModeEnum.owner, 1)], else_=0)
        ).label("cnt_owner_validated")
        result = (
            self.dbs.query(Example)
            .join(Context, Example.cid == Context.id)
            .filter(Context.r_realid == rid)
            .filter(Example.retracted == False)  # noqa
        )

        if tags:
            result = result.filter(Example.tag.in_(tags))  # noqa

        if not validate_non_fooling:
            result = result.filter(Example.model_wrong == True)  # noqa

        result_not_validated = result.filter(
            db.not_(db.exists().where(Validation.eid == Example.id))
        )

        result = (
            result.join(Validation, Example.id == Validation.eid)
            .group_by(Validation.eid)
            .having(cnt_owner_validated == 0)
        )

        cnt_flagged = db.sql.func.sum(
            case([(Validation.label == LabelEnum.flagged, 1)], else_=0)
        ).label("cnt_flagged")
        result = result.having(
            db.and_(cnt_flagged <= max_num_flags, cnt_flagged >= min_num_flags)
        )

        cnt_correct = db.sql.func.sum(
            case([(Validation.label == LabelEnum.correct, 1)], else_=0)
        ).label("cnt_correct")
        cnt_incorrect = db.sql.func.sum(
            case([(Validation.label == LabelEnum.incorrect, 1)], else_=0)
        ).label("cnt_incorrect")
        result = result.having(
            db.or_(
                db.and_(
                    cnt_incorrect > cnt_correct,
                    cnt_correct >= min_num_disagreements,
                    cnt_correct <= max_num_disagreements,
                ),
                db.and_(
                    cnt_correct >= cnt_incorrect,
                    cnt_incorrect >= min_num_disagreements,
                    cnt_incorrect <= max_num_disagreements,
                ),
            )
        )

        if min_num_disagreements == 0 and min_num_flags == 0:
            result = result.union(result_not_validated)

        result = (
            result.order_by(
                db.not_(Example.model_wrong),
                Example.total_verified.asc(),
                db.sql.func.rand(),
            )
            .limit(n)
            .all()
        )
        return result
