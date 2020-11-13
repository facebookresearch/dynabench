# Copyright (c) Facebook, Inc. and its affiliates.

import datetime
import json

import sqlalchemy as db

from common.logging import logger

from .base import Base, BaseModel
from .example import Example
from .notification import NotificationModel
from .round import RoundModel
from .score import ScoreModel
from .user import User, UserModel
from .validation import Validation


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
        self.task_shortname_to_badge_task_name = {
            "NLI": "nli",
            "Hate Speech": "hs",
            "QA": "qa",
            "Sentiment": "sent",
        }
        self.task_contributor_type_and_num_required_creations = [
            ("BRONZE", 50),
            ("SILVER", 100),
            ("GOLD", 200),
            ("PLATINUM", 500),
            ("DIAMOND", 1000),
        ]
        self.contributor_type_num_required_creations_and_validations = [
            ("BRONZE", 200, 100),
            ("SILVER", 500, 200),
            ("GOLD", 1000, 500),
            ("PLATINUM", 5000, 1000),
            ("DIAMOND", 10000, 5000),
        ]
        self.day_streak_type_and_num_required_days = [
            ("2", 2),
            ("3", 3),
            ("5", 5),
            ("1_WEEK", 7),
            ("2_WEEK", 14),
            ("1_MONTH", 30),
            ("3_MONTH", 90),
            ("1_YEAR", 365),
        ]
        self.example_streak_num_required = [5, 10, 20, 50, 100]

    def _badgeobj(self, user, name, metadata=None):
        return {"uid": user.id, "name": name, "metadata": metadata}

    def handleCronjob(self):

        one_week_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        badges_to_remove = []
        users = self.dbs.query(User)
        badges = self.dbs.query(Badge)
        examples = self.dbs.query(Example)
        validations = self.dbs.query(Validation)
        validations_by_eid = {}
        for validation in validations:
            if validation.eid in validations_by_eid:
                validations_by_eid[validation.eid].append(validation)
            else:
                validations_by_eid[validation.eid] = [validation]
        badges_and_examples_by_uid = {}
        for badge in badges:
            if badge.uid in badges_and_examples_by_uid:
                badges_and_examples_by_uid[badge.uid]["badges"].append(badge)
            else:
                badges_and_examples_by_uid[badge.uid] = {
                    "badges": [badge],
                    "examples": [],
                }
        num_created_by_uid = {}
        max_num_created = 0
        for example in examples:
            if example.generated_datetime > one_week_ago:
                if example.uid in num_created_by_uid:
                    num_created_by_uid[example.uid] += 1
                else:
                    num_created_by_uid[example.uid] = 1
                if num_created_by_uid[example.uid] > max_num_created:
                    max_num_created = num_created_by_uid[example.uid]

            if example.uid in badges_and_examples_by_uid:
                badges_and_examples_by_uid[example.uid]["examples"].append(example)
            else:
                badges_and_examples_by_uid[example.uid] = {
                    "badges": [],
                    "examples": [example],
                }

        weekly_winners = [
            uid
            for uid, num_created in num_created_by_uid.items()
            if num_created == max_num_created
        ]

        for user in users:
            if user.metadata_json:
                metadata = json.loads(user.metadata_json)
            else:
                metadata = {}

            # Recompute all example streaks for a user.
            recomputed_example_streak_badge_names = []
            recomputed_day_streak_badge_names = []
            user_examples = badges_and_examples_by_uid[user.id]["examples"]
            example_streak_count = 0
            day_streak_count = 0
            previous_example_day = user_examples[0].generated_datetime
            for example in user_examples:
                task = example.context.round.task
                num_matching_validations = 3
                if task.settings_json:
                    task_settings = json.loads(task.settings_json)
                    if "num_matching_validations" in task_settings:
                        num_matching_validations = task_settings[
                            "num_matching_validations"
                        ]
                example_validations = validations_by_eid[example.id]
                if (
                    len(
                        filter(
                            lambda validation: validation.name == "flagged",
                            example_validations,
                        )
                    )
                    >= num_matching_validations
                    or len(
                        filter(
                            lambda validation: validation.name == "incorrect",
                            example_validations,
                        )
                    )
                    >= num_matching_validations
                ):
                    example_streak_count = 0
                else:
                    example_streak_count += 1
                    one_day_passed = previous_example_day + datetime.timedelta(days=1)
                    two_days_passed = previous_example_day + datetime.timedelta(days=2)
                    if example.generated_datetime > one_day_passed:
                        if example.generated_datetime <= two_days_passed:
                            day_streak_count += 1
                            for (
                                streak_type,
                                num_required,
                            ) in self.day_streak_type_and_num_required_days:
                                if day_streak_count == num_required:
                                    recomputed_day_streak_badge_names.append(
                                        "DAY_STREAK_" + streak_type
                                    )
                        elif example.generated_datetime > two_days_passed:
                            day_streak_count = 0
                        previous_example_day = example.generated_datetime

                if example_streak_count in self.example_streak_num_required:
                    recomputed_example_streak_badge_names.append(
                        "EXAMPLE_STREAK_" + example_streak_count
                    )

            # Remove a user's undeserved badges.
            for badge in badges_and_examples_by_uid[user.id]["badges"]:
                for num_required in self.example_streak_num_required:
                    if badge.name == "EXAMPLE_STREAK_" + str(num_required):
                        if badge.name in recomputed_example_streak_badge_names:
                            recomputed_example_streak_badge_names.remove(badge.name)
                        else:
                            badges_to_remove.append(badge)
                for (
                    streak_type,
                    num_required,
                ) in self.day_streak_type_and_num_required_days:
                    if badge.name == "DAY_STREAK_" + streak_type:
                        if badge.name in recomputed_day_streak_badge_names:
                            recomputed_day_streak_badge_names.remove(badge.name)
                        else:
                            badges_to_remove.append(badge)
                for (
                    contributor_type,
                    num_required_creations,
                    _,
                ) in self.contributor_type_num_required_creations_and_validations:
                    if badge.name == "DYNABENCH_" + contributor_type:
                        num_created_by_task = self._get_fields_from_metadata(
                            metadata,
                            0,
                            [
                                task_name + "_fooling_no_verified_incorrect_or_flagged"
                                for task_name in self.task_shortname_to_badge_task_name
                            ],
                        )
                        if sum(num_created_by_task) < num_required_creations:
                            badges_to_remove.append(badge)
                for task_name in self.task_shortname_to_badge_task_name:
                    for (
                        contributor_type,
                        num_required_creations,
                    ) in self.task_contributor_type_and_num_required_creations:
                        if (
                            badge.name
                            == "DYNABENCH_"
                            + self.task_shortname_to_badge_task_name[task_name]
                            + "_"
                            + contributor_type
                        ):
                            if (
                                task_name + "_fooling_no_verified_incorrect_or_flagged"
                                in metadata
                            ):
                                if (
                                    metadata[
                                        task_name
                                        + "_fooling_no_verified_incorrect_or_flagged"
                                    ]
                                    < num_required_creations
                                ):
                                    badges_to_remove.append(badge.id)
                            else:
                                badges_to_remove.append(badge.id)

            # Award badges that must be computed asynchronously.
            if user.total_verified_fooled > 0 and "FIRST_VALIDATED_FOOLING" not in [
                badge.name for badge in badges_and_examples_by_uid[user.id]["badges"]
            ]:
                metadata["async_badges_to_award"].append("FIRST_VALIDATED_FOOLING")

            if badges_and_examples_by_uid[user.id]["examples"][
                -1
            ] - badges_and_examples_by_uid[user.id]["examples"][0] > datetime.timedelta(
                days=1
            ) and "FIRST_STEPS" not in [
                badge.name for badge in badges_and_examples_by_uid[user.id]["badges"]
            ]:
                metadata["async_badges_to_award"].append("FIRST_STEPS")

            if user.id in weekly_winners:
                metadata["async_badges_to_award"].append("WEEKLY_WINNER")

            user.metadata_json = json.dumps(metadata)

        self.dbs.delete().where(Badge.id.in_([badge.id for id in badges_to_remove]))
        nm = NotificationModel()
        for badge in badges_to_remove:
            nm.create(
                badge.uid,
                "BADGE_REMOVED",
                "Some of your examples were validated as incorrect or flagged,"
                + " which resulted in the removal of "
                + badge.name
                + ". Win it back by generating more examples!",
            )
        self.dbs.commit()

    def handleUnpubishModel(self, user, model):
        metadata = json.loads(user.metadata_json)
        metadata[model.task.shortname + "_models_published"] -= 1
        user.metadata_json = json.dumps(metadata)
        self.dbs.commit()

        notifications = []
        existing_badges = self.getByUid(user.id)
        models_published = self._get_fields_from_metadata(
            metadata,
            0,
            [
                task_name + "_models_published"
                for task_name in self.task_shortname_to_badge_task_name
            ],
        )
        models_published_sum = sum(models_published)

        for badge in existing_badges:
            if (
                (
                    badge.name == "SOTA"
                    and json.loads(badge.metadata_json)["mid"] == model.id
                )
                or (badge.name == "SERIAL_PREDICTOR" and models_published_sum < 2)
                or (badge.name == "MODEL_BUILDER" and models_published_sum < 1)
                or (badge.name == "MULTITASKER" and 0 in models_published)
            ):
                self.dbs.delete(Badge).where(Badge.id == badge.id)
                notifications.append(badge)

    def handlePublishModel(self, user, model):
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            if model.task.shortname + "_models_published" in metadata:
                metadata[model.task.shortname + "_models_published"] += 1
            else:
                metadata[model.task.shortname + "_models_published"] = 1
        else:
            metadata = {model.task.shortname + "_models_published": 1}
        user.metadata_json = json.dumps(metadata)
        self.dbs.commit()

        badges = []
        existing_badges = self.getByUid(user.id)

        # SOTA badge
        if (
            len(
                filter(
                    lambda badge: badge.name == "SOTA"
                    and json.loads(badge.metadata_json)["mid"] == model.id,
                    existing_badges,
                )
            )
            == 0
        ):
            sm = ScoreModel()
            rm = RoundModel()
            scores = sm.getByMid(model.id)
            for score in scores:
                round = rm.get(score.rid)

                if model.id == sm.getOverallModelPerfByTask(round.tid)[0].mid:
                    badges.append(self._badgeobj(user, "SOTA", {"mid": model.id}))
                    break

                if model.id == sm.getModelPerfByTidAndRid(round.tid, round.rid)[0].mid:
                    badges.append(self._badgeobj(user, "SOTA", {"mid": model.id}))
                    break

        models_published = self._get_fields_from_metadata(
            metadata,
            0,
            [
                task_name + "_models_published"
                for task_name in self.task_shortname_to_badge_task_name
            ],
        )
        models_published_sum = sum(models_published)

        # SERIAL_PREDICTOR badge
        if (
            len(filter(lambda badge: badge.name == "SERIAL_PREDICTOR", existing_badges))
            == 0
        ):
            if models_published_sum == 2:
                badges.append(self._badgeobj(user, "SERIAL_PREDICTOR"))

        # MODEL_BUILDER badge
        if (
            len(filter(lambda badge: badge.name == "MODEL_BUILDER", existing_badges))
            == 0
        ):
            if models_published_sum == 1:
                badges.append(self._badgeobj(user, "MODEL_BUILDER"))

        # MULTITASKER badge
        if len(filter(lambda badge: badge.name == "MULTITASKER", existing_badges)) == 0:
            if user.metadata_json:
                metadata = json.loads(user.metadata_json)
                if 0 not in models_published:
                    badges.append(self._badgeobj(user, "MULTITASKER"))

        return badges

    def handleHomePage(self, user):
        badges = []

        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            if "async_badges_to_award" in metadata:
                for name in metadata["async_badges_to_award"]:
                    badges.append(self._badgeobj(user, name))
                metadata["async_badges_to_award"] = []
                user.metadata_json = json.dumps(metadata)
                self.dbs.commit()

        return badges

    def handleCreateInterface(self, user, example):
        badges = []

        user.examples_submitted = user.examples_submitted + 1
        streak_days_increased = False
        if example.model_wrong:
            user.streak_examples = user.streak_examples + 1
            now = datetime.datetime.now()
            if user.streak_days_last_model_wrong is None:
                user.streak_days_last_model_wrong = now
            else:
                one_day_passed = user.streak_days_last_model_wrong + datetime.timedelta(
                    days=1
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

        # beginner badges
        if user.examples_submitted == 1:
            badges.append("FIRST_CREATED")
        if user.examples_submitted == 10:
            badges.append("FIRST_TEN_CREATED")

        # Contributor badges
        existing_badges = self.getByUid(user.id)
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            for task_name in self.task_shortname_to_badge_task_name:
                if task_name + "_fooling_no_verified_incorrect_or_flagged" in metadata:
                    for (
                        contributor_type,
                        num_required,
                    ) in self.task_contributor_type_and_num_required_creations:
                        if (
                            metadata[
                                task_name + "_fooling_no_verified_incorrect_or_flagged"
                            ]
                            == num_required
                        ):
                            if (
                                len(
                                    filter(
                                        lambda badge: badge.name
                                        == "DYNABENCH_"
                                        + self.task_shortname_to_badge_task_name[
                                            task_name
                                        ]
                                        + "_"
                                        + contributor_type,
                                        existing_badges,
                                    )
                                )
                                == 0
                            ):
                                badges.append(
                                    "DYNABENCH_"
                                    + self.task_shortname_to_badge_task_name[task_name]
                                    + "_"
                                    + contributor_type
                                )
            for (
                contributor_type,
                num_creations_required,
                num_validations_required,
            ) in self.contributor_type_num_required_creations_and_validations:
                if (
                    sum(
                        self._get_fields_from_metadata(
                            metadata,
                            0,
                            [
                                task_name + "_fooling_no_verified_incorrect_or_flagged"
                                for task_name in self.task_shortname_to_badge_task_name
                            ],
                        )
                    )
                    >= num_creations_required
                    and user.total_verified >= num_validations_required
                ):
                    if (
                        len(
                            filter(
                                lambda badge: badge.name
                                == "DYNABENCH_" + contributor_type,
                                existing_badges,
                            )
                        )
                        == 0
                    ):
                        badges.append("DYNABENCH_" + contributor_type)

        # Example streaks
        for num_required in self.example_streak_num_required:
            if user.streak_examples == num_required:
                badges.append("EXAMPLE_STREAK_" + str(num_required))

        # Day streaks
        if streak_days_increased:
            for streak_type, num_required in self.day_streak_type_and_num_required_days:
                if user.streak_days == num_required:
                    badges.append("DAY_STREAK_" + streak_type)

        return [self._badgeobj(user, b) for b in badges]

    def _get_fields_from_metadata(metadata, value_if_absent, fields):
        values = []
        for field in fields:
            if field in metadata:
                values.append(metadata[field])
            else:
                values.append(value_if_absent)
        return values

    def handleValidateInterface(self, user):
        badges = []
        existing_badges = self.getByUid(user.id)

        # Validate beginner badges
        if user.examples_verified == 1:
            badges.append("FIRST_VERIFIED")

        # Contributor badges
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            num_created_by_task = self._get_fields_from_metadata(
                metadata,
                0,
                [
                    task_name + "_fooling_no_verified_incorrect_or_flagged"
                    for task_name in self.task_shortname_to_badge_task_name
                ],
            )
            num_validated_by_task = self._get_fields_from_metadata(
                metadata,
                0,
                [
                    task_name + "_validated"
                    for task_name in self.task_shortname_to_badge_task_name
                ],
            )
            if 0 not in num_created_by_task + num_validated_by_task:
                if (
                    len(
                        filter(
                            lambda badge: badge.name == "ALL_TASKS_COVERED",
                            existing_badges,
                        )
                    )
                    == 0
                ):
                    badges.append()
            for num_creations_required, num_validations_required, contributor_type in [
                (200, 100, "BRONZE"),
                (500, 200, "SILVER"),
                (1000, 500, "GOLD"),
                (5000, 1000, "PLATINUM"),
                (10000, 5000, "DIAMOND"),
            ]:
                if (
                    sum(num_created_by_task) >= num_creations_required
                    and user.total_verified >= num_validations_required
                ):
                    if (
                        len(
                            filter(
                                lambda badge: badge.name
                                == "DYNABENCH_" + contributor_type,
                                existing_badges,
                            )
                        )
                        == 0
                    ):
                        badges.append("DYNABENCH_" + contributor_type)

        return [self._badgeobj(user, b) for b in badges]

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
