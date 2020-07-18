import logging
import sqlalchemy as db
from sqlalchemy import case
from .base import Base, BaseModel
from .context import ContextModel
from .user import UserModel

from models.user import User
from models.context import Context
from models.round import Round
from models.task import Task

import numpy as np

from common import helpers as util

class Example(Base):
    __tablename__ = 'examples'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)

    cid = db.Column(db.Integer, db.ForeignKey("contexts.id"), nullable=False)
    context = db.orm.relationship("Context", foreign_keys="Example.cid")

    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user = db.orm.relationship("User", foreign_keys="Example.uid")

    annotator_id = db.Column(db.Text)
    anon_id = db.Column(db.Text)

    text = db.Column(db.Text)
    example_explanation = db.Column(db.Text) # why is X the label for this example
    model_explanation = db.Column(db.Text) # why do you think the model got it wrong

    metadata_json = db.Column(db.Text)

    target_pred = db.Column(db.Text)
    model_preds = db.Column(db.Text)
    verifier_preds = db.Column(db.Text)
    target_model = db.Column(db.Text)

    split = db.Column(db.String(length=255), default='undecided')

    model_wrong = db.Column(db.Boolean)
    retracted = db.Column(db.Boolean, default=False)
    flagged = db.Column(db.Boolean, default=False)
    verified_correct = db.Column(db.Boolean, default=False)

    generated_datetime = db.Column(db.DateTime)

    time_elapsed = db.Column(db.Time) # time context shown - time example provided

    def __repr__(self):
        return '<Example {}>'.format(self.id)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            if safe and column.name in ['secret']: continue
            d[column.name] = str(getattr(self, column.name))
        return d

class ExampleModel(BaseModel):
    def __init__(self):
        super(ExampleModel, self).__init__(Example)

    def create(self, tid, rid, uid, cid, hypothesis, tgt, response, signed, annotator_id=None, model=''):
        if uid == 'turk' and annotator_id is None:
            logging.error('Annotator id not specified but received Turk example')
            return False

        cm = ContextModel()
        c = cm.get(cid)
        if int(tid) != c.round.task.id or int(rid) != c.round.rid:
            logging.error('Task id ({}={}) or round id ({}={}) do not match context'.format(tid, c.round.task.id, rid, c.round.rid))
            return False

        # If task has_answer, handle here (specifically target_pred and model_wrong)
        if c.round.task.has_answer:
            pred = str(response['model_is_correct']) + '|' + str(response['text'])
            model_wrong = not response['model_is_correct']
            if response.get('model_id', ''):
                model += '|' + response['model_id']
        else:
            pred = response['prob']
            model_wrong = (tgt != np.argmax(pred))

        import hashlib
        h = hashlib.sha1()
        if isinstance(pred, list):
            pred_str = '|'.join([str(x) for x in pred])
        else:
            pred_str = pred
        h.update(pred_str.encode('utf-8'))
        if c.round.task.has_context:
            # no context for e.g. sentiment
            h.update(c.context.encode('utf-8'))
        h.update(hypothesis.encode('utf-8'))
        h.update("{}{}{}".format(tid, rid, c.round.secret).encode('utf-8'))
        if h.hexdigest() != signed:
            rawstr = pred_str.encode('utf-8') + c.context.encode('utf-8') + hypothesis.encode('utf-8') + "{}{}{}".format(tid, rid, c.round.secret).encode('utf-8')
            logging.error("Signature does not match (received %s, expected %s [%s])" %
                    (h.hexdigest(), signed, rawstr))
            return False

        try:
            e = Example(context=c, \
                    text=hypothesis, target_pred=tgt, model_preds=pred_str, \
                    model_wrong=model_wrong,
                    generated_datetime=db.sql.func.now(), target_model=model)

            # store uid/annotator_id and anon_id
            anon_id = hashlib.sha1()
            anon_id.update(c.round.secret.encode('utf-8'))
            if uid == 'turk':
                e.annotator_id = annotator_id
                anon_id.update(e.annotator_id.encode('utf-8'))
            else:
                um = UserModel()
                user = um.get(uid)
                e.user = user
                anon_id.update(str(uid).encode('utf-8'))
            e.anon_id = anon_id.hexdigest()

            self.dbs.add(e)
            self.dbs.flush()
            self.dbs.commit()
            logging.info('Added example (%s)' % (e.id))
        except Exception as error_message:
            logging.error('Could not create example (%s)' % error_message)
            return False
        return e.id

    def getRandomToVerify(tid, n=1):
        # https://stackoverflow.com/questions/60805/getting-random-row-through-sqlalchemy
        example = Example()
        return example.query.filter(Example.tid == tid).filter(Example.model_wrong == True).filter(Example.retracted == False).filter(Example.verified_correct == False).options(db.orm.load_only('id')).offset(
                db.sql.func.floor(
                    db.sql.func.random() *
                    self.dbs.query(db.sql.func.count(example.id))
                )
            ).limit(n).all()

    def getUserLeaderByTid(self, tid, n=5, offset=0, min_cnt=0, downstream=False):
        cnt = db.sql.func.sum(case([(Example.model_wrong == 1, 1)], else_=0)).label('cnt')
        query_res = self.dbs.query(User.id, User.username, User.avatar_url, cnt, (cnt / db.func.count()), db.func.count()) \
            .join(Example, User.id == Example.uid) \
            .join(Context, Example.cid == Context.id) \
            .join(Round, Context.r_realid == Round.id) \
            .join(Task, Round.tid == Task.id).filter(Task.id == tid) \
            .group_by(User.id).having(db.func.count() > min_cnt) \
            .order_by((cnt / db.func.count()).desc())
        if not downstream:
            return query_res.limit(n).offset(n * offset), util.get_query_count(query_res)
        return query_res

    def getUserLeaderByTidAndRid(self, tid, rid, n=5, offset=0, min_cnt=0):
        query_res = self.getUserLeaderByTid(tid, n, offset, min_cnt, downstream=True) \
                .filter(Round.rid == rid)
        return query_res.limit(n).offset(n * offset), util.get_query_count(query_res)
