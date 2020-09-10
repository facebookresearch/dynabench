# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db
from .base import Base, BaseModel

from common import helpers as util

from models.user import User, UserModel

import logging

class Notification(Base):
    __tablename__ = 'notifications'
    __table_args__ = { 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_general_ci' }

    id = db.Column(db.Integer, primary_key=True)

    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user = db.orm.relationship("User", foreign_keys="Notification.uid")

    type = db.Column(db.String(length=255))
    """
    NEW_BADGE_EARNED
    ...
    """

    message = db.Column(db.Text)

    metadata_json = db.Column(db.Text)

    seen = db.Column(db.Boolean, default=False)

    created = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return '<Notification {}>'.format(self.msg)

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

class NotificationModel(BaseModel):
    def __init__(self):
        super(NotificationModel, self).__init__(Notification)

    def getByUid(self, uid, n=10, offset=0):
        query_res = self.dbs.query(Notification) \
                .filter(Notification.uid == uid) \
                .order_by(Notification.created.desc())
        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)

    def setAllSeen(self, uid):
        for n in self.dbs.query(Notification) \
            .filter(Notification.uid == uid) \
            .filter(Notification.seen == False) \
            .all():
                n.seen = True
        um = UserModel()
        um.resetNotificationCount(uid)
        return self.dbs.commit()

    def create(self, uid, type, message, **kwargs):
        um = UserModel()
        u = um.get(uid)
        if not u:
            return False
        try:
            n = Notification( \
                    user=u, \
                    type=type, \
                    message=message, \
                    created=db.sql.func.now(), \
                    **kwargs)
            um.incrementNotificationCount(uid)
            logging.info('Added notification (%s)' % (n.id))
        except Exception as error_message:
            logging.error('Could not create notification (%s)' % error_message)
            return False

        return n.id
