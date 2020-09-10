# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db
from .base import Base, BaseModel
import secrets
import datetime

from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    __tablename__ = 'users'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(length=255), nullable=False, unique=True)
    email = db.Column(db.String(length=255), nullable=False, unique=True)
    password = db.Column(db.String(length=255), nullable=False)
    realname = db.Column(db.String(length=255))
    affiliation = db.Column(db.String(length=255))

    refresh_token = db.Column(db.String(length=255))
    forgot_password_token = db.Column(db.String(length=255))
    forgot_password_token_expiry_date = db.Column(db.DateTime)

    examples_verified_correct = db.Column(db.Integer, default=0)
    examples_submitted = db.Column(db.Integer, default=0)
    examples_verified = db.Column(db.Integer, default=0)

    unseen_notifications = db.Column(db.Integer, default=0)

    streak_examples = db.Column(db.Integer, default=0)
    streak_days = db.Column(db.Integer, default=0)
    streak_days_last_model_wrong = db.Column(db.DateTime, nullable=True)

    avatar_url = db.Column(db.Text)

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            if safe and column.name in ['password', 'refresh_token', 'forgot_password_token',
                                        'forgot_password_token_expiry_date']: continue
            d[column.name] = getattr(self, column.name)
        return d

class UserModel(BaseModel):
    def __init__(self):
        super(UserModel, self).__init__(User)

    def create(self, email, password, username, **kwargs):
        u = User(email=email, username=username, **kwargs)
        u.set_password(password)
        self.dbs.add(u)
        return self.dbs.commit()

    def get(self, id):
        try:
            return self.dbs.query(User).filter(User.id == id).one()
        except db.orm.exc.NoResultFound:
            return False
    def getByEmail(self, email):
        try:
            return self.dbs.query(User).filter(User.email == email).one()
        except db.orm.exc.NoResultFound:
            return False
    def getByUsername(self, username):
        try:
            return self.dbs.query(User).filter(User.username == username).one()
        except db.orm.exc.NoResultFound:
            return False
    def getByEmailAndPassword(self, email, password):
        try:
            user = self.dbs.query(User).filter(User.email == email).one()
        except db.orm.exc.NoResultFound:
            return False
        if user.check_password(password):
            return user
        else:
            return False
    def getByRefreshToken(self, refresh_token):
        try:
            return self.dbs.query(User).filter(User.refresh_token == refresh_token).one()
        except db.orm.exc.NoResultFound:
            return False
    def getByForgotPasswordToken(self, forgot_password_token):
        try:
            return self.dbs.query(User).filter(User.forgot_password_token == forgot_password_token).one()
        except db.orm.exc.NoResultFound:
            return False
    def generate_password_reset_token(self):
        return secrets.token_hex(64)

    def exists(self, email=None, username=None):
        if email is not None:
            return self.dbs.query(User.id).filter_by(email=email).scalar() is not None
        elif username is not None:
            return self.dbs.query(User.id).filter_by(username=username).scalar() is not None
        else:
            return True # wtf?

    def list(self):
        users = self.dbs.query(User).all()
        return [u.to_dict() for u in users]

    def update(self, id, kwargs):
        u = self.dbs.query(User).filter(User.id == id)
        u.update(kwargs)
        self.dbs.commit()

    def updateSubmitCount(self, uid, wrong=False):
        u = self.get(uid)
        if u:
            u.examples_submitted = u.examples_submitted + 1
            if wrong:
                u.streak_examples = u.streak_examples + 1
                #now = db.sql.func.now()
                now = datetime.datetime.now()
                if u.streak_days_last_model_wrong is None:
                    u.streak_days_last_model_wrong = now
                else:
                    one_day_passed = u.streak_days_last_model_wrong \
                            + datetime.timedelta(days=1)
                    two_days_passed = u.streak_days_last_model_wrong \
                            + datetime.timedelta(days=2)
                    if now > one_day_passed:
                        if now <= two_days_passed:
                            u.streak_days = u.streak_days + 1
                            u.streak_days_last_model_wrong = now
                        elif now > two_days_passed:
                            u.streak_days = 0
                            u.streak_days_last_model_wrong = None
            else:
                u.streak_examples = 0
            self.dbs.commit()
        return u

    def updateValidatedCount(self, uid):
        u = self.get(uid)
        if u:
            u.examples_verified = u.examples_verified + 1
            self.dbs.commit()
        return u
    def incrementCorrectCount(self, uid):
        u = self.get(uid)
        if u:
            u.examples_verified_correct = u.examples_verified_correct + 1
            self.dbs.commit()
    def incrementNotificationCount(self, uid):
        u = self.get(uid)
        if u:
            u.unseen_notifications = u.unseen_notifications + 1
            self.dbs.commit()
    def resetNotificationCount(self, uid):
        u = self.get(uid)
        if u:
            u.unseen_notifications = 0
            self.dbs.commit()
