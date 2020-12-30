# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib
import json

import numpy as np
import sqlalchemy as db
from sqlalchemy import case

from common.logging import logger
from models.context import Context
from models.round import Round
from models.task import TaskModel
from models.user import User
from models.validation import LabelEnum, ModeEnum, Validation

from .base import Base, BaseModel
from .context import ContextModel
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

    text = db.Column(db.Text)
    # why is X the label for this example
    example_explanation = db.Column(db.Text)
    # why do you think the model got it wrong
    model_explanation = db.Column(db.Text)

    metadata_json = db.Column(db.Text)

    target_pred = db.Column(db.Text)
    model_preds = db.Column(db.Text)
    target_model = db.Column(db.Text)

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

    def create(self, tid, rid, uid, cid, hypothesis, tgt, response, metadata, tag=None):
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

        # If task has_answer, handle here (specifically target_pred and
        # model_wrong)
        if c.round.task.has_answer:
            if "model_is_correct" not in response or "text" not in response:
                return False
            pred = str(response["model_is_correct"]) + "|" + str(response["text"])
            model_wrong = not response["model_is_correct"]
            if "model_id" in response:
                pred += "|" + str(response["model_id"])
        else:
            if "prob" not in response:
                return False
            pred = response["prob"]
            model_wrong = tgt != np.argmax(pred)

        if isinstance(pred, list):
            pred_str = "|".join([str(x) for x in pred])
        else:
            pred_str = pred

        if uid == "turk" and "model" in metadata and metadata["model"] == "no-model":
            pass  # ignore signature when we don't have a model in the loop with turkers
        else:
            if "signed" not in response or not self.verify_signature(
                response["signed"], c, hypothesis, pred_str
            ):
                return False

        try:
            e = Example(
                context=c,
                text=hypothesis,
                target_pred=tgt,
                model_preds=pred_str,
                model_wrong=model_wrong,
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

    def verify_signature(self, signature, context, hypothesis, pred_str):
        tid = context.round.task.id
        rid = context.round.rid
        secret = context.round.secret
        context_str = context.context

        fields_to_sign = []
        fields_to_sign.append(pred_str.encode("utf-8"))
        if (
            context.round.task.has_context
            and context.round.task.shortname != "Sentiment"
        ):
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
        return True

    def get_anon_uid(self, secret, uid):
        anon_uid = hashlib.sha1()
        anon_uid.update(secret.encode("utf-8"))
        anon_uid.update(str(uid).encode("utf-8"))
        return anon_uid.hexdigest()

    def getUserLeaderByTidAndRid(
        self, tid, rid=None, n=5, offset=0, min_cnt=0, downstream=False
    ):
        task = TaskModel().get(tid)
        num_matching_validations = 3
        if task.settings_json:
            metadata = json.loads(task.settings_json)
            if "num_matching_validations" in metadata:
                num_matching_validations = metadata["num_matching_validations"]
        if rid is None:
            examples = self.getByTid(tid)
        else:
            examples = self.getByTidAndRid(tid, rid)
        validations = self.dbs.query(Validation)
        users = self.dbs.query(User)
        eid_to_example = {}
        eid_to_validations = {}
        uid_to_rest_of_result = {}
        uid_to_user = {}
        for user in users:
            uid_to_user[user.id] = user
        for example in examples:
            if example.uid is not None:
                eid_to_example[example.id] = example
                eid_to_validations[example.id] = []
        for validation in validations:
            if validation.eid in eid_to_validations:
                eid_to_validations[validation.eid].append(validation)
        for key, value in eid_to_validations.items():
            uid = eid_to_example[key].uid
            if uid not in uid_to_rest_of_result:
                uid_to_rest_of_result[uid] = [
                    uid_to_user[uid].username,
                    uid_to_user[uid].avatar_url,
                    0,
                    0,
                    0,
                ]
            if (
                eid_to_example[key].model_wrong
                and not eid_to_example[key].retracted
                and len(
                    list(
                        filter(
                            lambda validation: validation.label == LabelEnum.incorrect,
                            value,
                        )
                    )
                )
                < num_matching_validations
                and len(
                    list(
                        filter(
                            lambda validation: validation.label == LabelEnum.flagged,
                            value,
                        )
                    )
                )
                < num_matching_validations
                and len(
                    list(
                        filter(
                            lambda validation: validation.label == LabelEnum.incorrect
                            and validation.mode == ModeEnum.owner,
                            value,
                        )
                    )
                )
                == 0
                and len(
                    list(
                        filter(
                            lambda validation: validation.label == LabelEnum.flagged
                            and validation.mode == ModeEnum.owner,
                            value,
                        )
                    )
                )
                == 0
            ):
                uid_to_rest_of_result[uid][2] += 1
            uid_to_rest_of_result[uid][4] += 1
        result_list = []
        for key, value in uid_to_rest_of_result.items():
            value[3] = value[2] / value[4]
            if value[2] >= min_cnt:
                result_list.append([key] + value)
        result_list.sort(key=lambda result: -1 * result[3])

        if not downstream:
            return (result_list[n * offset : n * (offset + 1)], len(result_list))
        return result_list

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
