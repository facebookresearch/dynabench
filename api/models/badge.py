# Copyright (c) Facebook, Inc. and its affiliates.

import datetime

import sqlalchemy as db

from common.logging import logger

from .base import Base, BaseModel
from .user import UserModel


class Badge(Base):
    __tablename__ = "badges"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    uid = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user = db.orm.relationship("User", foreign_keys="Badge.uid")

    name = db.Column(db.String(length=255))
    """
    WELCOME_NOOB
    WEEKLY_WINNER
    FIRST_CREATED
    FIRST_VALIDATED_FOOLING
    FIRST_VERIFIED
    FIRST_TEN_CREATED
    ALL_TASKS_COVERED

    SOTA
    SERIAL_PREDICTOR
    MODEL_BUILDER
    MULTITASKER

    EXAMPLE_STREAK_5
    EXAMPLE_STREAK_10
    EXAMPLE_STREAK_20
    EXAMPLE_STREAK_50
    EXAMPLE_STREAK_100

    DAY_STREAK_2
    DAY_STREAK_3
    DAY_STREAK_5
    DAY_STREAK_1_WEEK
    DAY_STREAK_2_WEEK
    DAY_STREAK_1_MONTH
    DAY_STREAK_3_MONTH
    DAY_STREAK_1_YEAR
    """

    metadata_json = db.Column(db.Text)

    awarded = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Badge {self.name} uid {self.uid}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class BadgeModel(BaseModel):
    def __init__(self):
        super().__init__(Badge)

    def updateSubmitCountsAndCheckBadgesEarned(self, user, example, type):
        def _badgeobj(name):
            return {"uid": user.id, "name": name, "metadata": None}

        badges = []
        # badges.append('TESTING_BADGES')

        if type == "validate":
            # Validate beginner badges
            if user.examples_verified == 1:
                badges.append("FIRST_VERIFIED")
            if (
                user.total_verified_fooled == 1
                and "FIRST_VALIDATED_FOOLING"
                not in map(lambda badge: badge.name, self.getByUid(user.id))
            ):
                badges.append("FIRST_VALIDATED_FOOLING")

        elif type == "create":
            user.examples_submitted = user.examples_submitted + 1
            streak_days_increased = False
            if example.model_wrong:
                user.streak_examples = user.streak_examples + 1
                now = datetime.datetime.now()
                if user.streak_days_last_model_wrong is None:
                    user.streak_days_last_model_wrong = now
                else:
                    one_day_passed = (
                        user.streak_days_last_model_wrong + datetime.timedelta(days=1)
                    )
                    two_days_passed = (
                        user.streak_days_last_model_wrong + datetime.timedelta(days=2)
                    )
                    if now > one_day_passed:
                        if now <= two_days_passed:
                            streak_days_increased = True
                            user.streak_days = user.streak_days + 1
                            user.streak_days_last_model_wrong = now
                        elif now > two_days_passed:
                            user.streak_days = 0
                            user.streak_days_last_model_wrong = None
            else:
                user.streak_examples = 0
            self.dbs.commit()
            # Create beginner badges
            if user.examples_submitted == 1:
                badges.append("FIRST_CREATED")
            if user.examples_submitted == 10:
                badges.append("FIRST_TEN_CREATED")

            # Example streaks
            if user.streak_examples == 5:
                badges.append("EXAMPLE_STREAK_5")
            elif user.streak_examples == 10:
                badges.append("EXAMPLE_STREAK_10")
            elif user.streak_examples == 20:
                badges.append("EXAMPLE_STREAK_20")
            elif user.streak_examples == 50:
                badges.append("EXAMPLE_STREAK_50")
            elif user.streak_examples == 100:
                badges.append("EXAMPLE_STREAK_100")

            # Day streaks
            if streak_days_increased:
                if user.streak_days == 2:
                    badges.append("DAY_STREAK_2")
                elif user.streak_days == 3:
                    badges.append("DAY_STREAK_3")
                elif user.streak_days == 5:
                    badges.append("DAY_STREAK_5")
                elif user.streak_days == 7:
                    badges.append("DAY_STREAK_1_WEEK")
                elif user.streak_days == 14:
                    badges.append("DAY_STREAK_2_WEEK")
                elif user.streak_days == 30:
                    badges.append("DAY_STREAK_1_MONTH")
                elif user.streak_days == 90:
                    badges.append("DAY_STREAK_3_MONTH")
                elif user.streak_days == 365:
                    badges.append("DAY_STREAK_1_YEAR")
        else:
            raise ValueError(' "' + type + '" not recognized as a badge type.')

        for existing_badge in self.getByUid(user.id):
            if existing_badge.name in badges:
                badges.remove(existing_badge.name)

        return [_badgeobj(b) for b in badges]

    def addBadge(self, badge):
        self.create(
            badge["uid"],
            badge["name"],
            badge["metadata"] if "metadata" in badge else None,
        )

    def getByUid(self, uid):
        try:
            return self.dbs.query(Badge).filter(Badge.uid == uid).all()
        except db.orm.exc.NoResultFound:
            return False

    def getBadgesByName(self, uid, name):
        try:
            return (
                self.dbs.query(Badge)
                .filter(Badge.uid == uid)
                .filter(Badge.name == name)
                .all()
            )
        except db.orm.exc.NoResultFound:
            return False

    def create(self, uid, name, metadata_json):
        try:
            um = UserModel()
            user = um.get(uid)
            if not user:
                return False

            b = Badge(
                user=user,
                name=name,
                metadata_json=metadata_json,
                awarded=db.sql.func.now(),
            )
            self.dbs.add(b)
            self.dbs.flush()
            self.dbs.commit()
            logger.info(f"Awarded badge to user ({b.id}, {b.uid})")
        except Exception as error_message:
            logger.error("Could not create badge (%s)" % error_message)
            return False
        return b.id
