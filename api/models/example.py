# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib
import json

import dynalab.tasks.hs
import dynalab.tasks.nli
import dynalab.tasks.qa
import dynalab.tasks.sentiment
import sqlalchemy as db
from sqlalchemy import case

from common.logging import logger
from models.context import Context
from models.model import Model
from models.round import Round
from models.validation import LabelEnum, ModeEnum, Validation

from .base import Base, BaseModel
from .context import ContextModel
from .task import TaskModel
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

    input_io = db.Column(db.Text)
    target_io = db.Column(db.Text)
    output_io = db.Column(db.Text)
    metadata_io = db.Column(db.Text)

    metadata_json = db.Column(db.Text)

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
        input_io,
        target_io,
        output_io,
        model_signature,
        metadata,
        model_wrong,
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

        context_io = json.loads(c.context_io)

        all_user_io = {}
        all_user_io.update(context_io)
        all_user_io.update(input_io)
        all_user_io.update(target_io)
        if not TaskModel().get(tid).verify_io(all_user_io, None):
            logger.error("Improper formatting in user io")
            return False

        if (
            model_signature is None
            and model_wrong is None
            and model_endpoint_name is None
            and output_io is None
        ):
            pass  # ignore signature when we don't have a model in the loop with turkers
        else:
            # Make sure that we aren't accepting any corrupted example io
            all_model_io = {}
            all_model_io.update(context_io)
            all_model_io.update(input_io)
            all_model_io.update(output_io)
            if not TaskModel().get(tid).verify_io(all_model_io, None):
                logger.error("Improper formatting in model io")
                return False

            # TODO: can remove this when the dynalab part of dynatask is done
            if model_endpoint_name.startswith(
                "ts"
            ):  # This means that we have a dynalab model
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
                all_model_io["signed"] = model_signature
                if model_signature != dynalab_task.TaskIO().generate_response_signature(
                    all_model_io, all_model_io, model_secret
                ):
                    logger.error(
                        "Signature does not match (received %s, expected %s)"
                        % (
                            all_model_io["signed"],
                            dynalab_task.TaskIO().generate_response_signature(
                                all_model_io, all_model_io, model_secret
                            ),
                        )
                    )
                    return False
                else:
                    logger.info(
                        "Signature matches(received %s, expected %s)"
                        % (
                            all_model_io["signed"],
                            dynalab_task.TaskIO().generate_response_signature(
                                all_model_io, all_model_io, model_secret
                            ),
                        )
                    )
            else:
                # Begin hack that can be removed upon full dynalab integration
                if c.round.task.task_code in ("qa", "vqa"):
                    if (
                        c.round.task.task_code == "vqa"
                        and "answer" in output_io
                        and "prob" in output_io
                    ):
                        model_wrong = False
                        pred = (
                            str(output_io["answer"])
                            + "|"
                            + str(float(output_io["prob"]))
                        )
                    elif "model_is_correct" in output_io and "text" in output_io:
                        pred = (
                            str(output_io["model_is_correct"])
                            + "|"
                            + str(output_io["text"])
                        )
                        model_wrong = not output_io["model_is_correct"]
                    else:
                        return False
                    if "model_id" in output_io:
                        pred += "|" + str(output_io["model_id"])
                else:
                    if "prob" not in output_io:
                        return False
                    if c.round.task.task_code == "nli":
                        pred = "|".join(
                            [
                                str(output_io["prob"]["entailed"]),
                                str(output_io["prob"]["neutral"]),
                                str(output_io["prob"]["contradictory"]),
                            ]
                        )
                    if c.round.task.task_code == "sentiment":
                        pred = "|".join(
                            [
                                str(output_io["prob"]["negative"]),
                                str(output_io["prob"]["positive"]),
                                str(output_io["prob"]["neutral"]),
                            ]
                        )
                    if c.round.task.task_code == "hs":
                        pred = "|".join(
                            [
                                str(output_io["prob"]["not-hateful"]),
                                str(output_io["prob"]["hateful"]),
                            ]
                        )

                if not self.verify_signature(
                    model_signature, c, list(input_io.values())[0], pred
                ):
                    return False
                # End hack that can be removed upon full dynalab integration

        try:
            e = Example(
                context=c,
                input_io=json.dumps(input_io),
                target_io=json.dumps(target_io),
                output_io=json.dumps(output_io),
                model_wrong=model_wrong,
                generated_datetime=db.sql.func.now(),
                metadata_json=json.dumps(metadata),
                tag=tag,
                model_endpoint_name=model_endpoint_name,
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

    # Begin hack that can be removed upon full dynalab integration
    def verify_signature(self, signature, context, hypothesis, pred_str):
        tid = context.round.task.id
        rid = context.round.rid
        secret = context.round.secret
        context_str = list(json.loads(context.context_io).values())[0]

        fields_to_sign = []
        fields_to_sign.append(pred_str.encode("utf-8"))
        if context.round.task.task_code not in ("sentiment", "hs"):
            fields_to_sign.append(context_str.encode("utf-8"))
        fields_to_sign.append(hypothesis.encode("utf-8"))
        fields_to_sign.append(f"{tid}{rid}{secret}".encode("utf-8"))

        h = hashlib.sha1()
        for f in fields_to_sign:
            h.update(f)

        if h.hexdigest() != signature:
            logger.error(
                "Signature does not match (received %s, expected %s [%s])"
                % (h.hexdigest(), signature, "".join([str(x) for x in fields_to_sign]))
            )
            return False
        else:
            logger.info(
                "Signature matched (received %s, expected %s [%s])"
                % (h.hexdigest(), signature, "".join([str(x) for x in fields_to_sign]))
            )

        return True

    # End hack that can be removed upon full dynalab integration

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
