import sqlalchemy as db
from .base import Base, dbs, BaseModel

class Example(Base):
    __tablename__ = 'examples'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    tid = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    rid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    cid = db.Column(db.Integer, db.ForeignKey("contexts.id"), nullable=False)

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

    def create(self, context_id, target_pred, model_preds, model_wrong, text, explanation, **kwargs):
        e = Example(cid=context_id, target_pred=target_pred, model_preds=model_preds,
                text=text, explanation=explanation, generated_datetime=db.sql.func.now(),
                **kwargs)
        dbs.add(e)
        return dbs.commit()

    def getRandomToVerify(tid, n=1):
        # https://stackoverflow.com/questions/60805/getting-random-row-through-sqlalchemy
        example = Example()
        return example.query.filter(Example.tid == tid).filter(Example.model_wrong == True).filter(Example.retracted == False).filter(Example.verified_correct == False).options(db.orm.load_only('id')).offset(
                db.sql.func.floor(
                    db.sql.func.random() *
                    dbs.query(db.sql.func.count(example.id))
                )
            ).limit(n).all()

