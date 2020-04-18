import logging
import sqlalchemy as db
from .base import Base, BaseModel
from .context import ContextModel
from .user import UserModel
import numpy as np

class Example(Base):
    __tablename__ = 'examples'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    cid = db.Column(db.Integer, db.ForeignKey("contexts.id"), nullable=False)
    context = db.orm.relationship("Context", foreign_keys="Example.cid")
    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    user = db.orm.relationship("User", foreign_keys="Example.uid")

    text = db.Column(db.Text)
    explanation = db.Column(db.Text)

    target_pred = db.Column(db.Integer)
    model_preds = db.Column(db.Text)
    verifier_preds = db.Column(db.Text)

    model_wrong = db.Column(db.Boolean)
    retracted = db.Column(db.Boolean, default=False)
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

    def create(self, tid, rid, uid, cid, hypothesis, tgt, pred, signed):
        cm = ContextModel()
        c = cm.get(cid)
        if int(tid) != c.round.task.id or int(rid) != c.round.rid:
            logging.error('Task id ({}={}) or round id ({}={}) do not match context'.format(tid, c.round.task.id, rid, c.round.rid))
            return False

        pred_str = '|'.join(str(x) for x in pred)

        import hashlib
        h = hashlib.sha1()
        if c.round.task.has_context:
            # no context for e.g. sentiment
            h.update(c.context.encode('utf-8'))
        h.update(hypothesis.encode('utf-8'))
        h.update("{}{}{}".format(tid, rid, pred_str).encode('utf-8'))
        h.update(c.round.secret.encode('utf-8'))
        if h.hexdigest() != signed:
            logging.error("Signature does not match (received %s, expected %s)" %
                    (h.hexdigest(), signed))
            return False

        try:
            um = UserModel()
            user = um.get(uid)
            e = Example(user=user, context=c, \
                    text=hypothesis, target_pred=tgt, model_preds=pred_str, \
                    model_wrong=(tgt != np.argmax(pred)),
                    generated_datetime=db.sql.func.now())
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

