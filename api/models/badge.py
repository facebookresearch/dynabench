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
    ALL_TASKS_COVERED
    DYNABENCH_BRONZE
    DYNABENCH_GOLD
    DYNABENCH_SILVER
    DYNABENCH_PLATINUM
    DYNABENCH_HS_BRONZE
    DYNABENCH_HS_GOLD
    DYNABENCH_HS_SILVER
    DYNABENCH_HS_PLATINUM
    DYNABENCH_NLI_BRONZE
    DYNABENCH_NLI_GOLD
    DYNABENCH_NLI_SILVER
    DYNABENCH_NLI_PLATINUM
    DYNABENCH_QA_BRONZE
    DYNABENCH_QA_GOLD
    DYNABENCH_QA_SILVER
    DYNABENCH_QA_PLATINUM
    DYNABENCH_SENT_BRONZE
    DYNABENCH_SENT_GOLD
    DYNABENCH_SENT_SILVER
    DYNABENCH_SENT_PLATINUM
    TESTING_BADGES
    WELCOME_NOOB
    FIRST_CREATED
    FIRST_STEPS
    FIRST_VALIDATED_FOOLING
    FIRST_VERIFIED
    FIRST_TEN_CREATED
    ALL_TASKS_COVERED
    MODEL_BUILDER
    SOTA
    SERIAL_PREDICTOR
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
    WEEKLY_WINNER
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
        self.task_shortname_to_badge_name = {
            "NLI": "NLI",
            "Hate Speech": "HS",
            "QA": "QA",
            "Sentiment": "SENT",
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

    def _badgeobj(self, uid, name, metadata=None):
        return {"uid": uid, "name": name, "metadata": metadata}

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

    def createNotificationsAndRemoveBadges(self, badges_to_remove, type):
        self.dbs.query(Badge).filter(
            Badge.id.in_([badge.id for badge in badges_to_remove])
        ).delete(synchronize_session="fetch")
        nm = NotificationModel()
        for badge in badges_to_remove:
            nm.create(badge.uid, type, badge.name)
        self.dbs.commit()

    def createNotificationsAndAddBadges(self, badge_dicts_to_add):
        nm = NotificationModel()
        for badge_dict in badge_dicts_to_add:
            self.addBadge(badge_dict)
            nm.create(badge_dict["uid"], "NEW_BADGE_EARNED", badge_dict["name"])
        self.dbs.commit()

    def incrementUserMetadataField(self, user, key, value=1):
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            if key in metadata:
                metadata[key] += value
            else:
                metadata[key] = value
        else:
            metadata = {key: value}
        user.metadata_json = json.dumps(metadata)
        self.dbs.commit()

    def getFieldsFromMetadata(self, metadata, value_if_absent, fields):
        values = []
        for field in fields:
            if field in metadata:
                values.append(metadata[field])
            else:
                values.append(value_if_absent)
        return values

    def lengthOfFilteredList(self, function, iterable):
        return len(list(filter(function, iterable)))

    def handleAsync(self):
        one_week_ago = datetime.datetime.now() - datetime.timedelta(days=7)
        badges_to_remove = []
        badges_to_add = []
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

            async_badges_to_award = []

            # Recompute all example streaks for a user.
            recomputed_example_streak_badge_names = []
            recomputed_day_streak_badge_names = []
            if user.id in badges_and_examples_by_uid:
                user_examples = badges_and_examples_by_uid[user.id]["examples"]
                if len(user_examples) > 0:
                    example_streak_count = 0
                    day_streak_count = 0
                    previous_example_day = user_examples[0].generated_datetime
                    for example in user_examples:
                        if example.context:
                            task = example.context.round.task
                            num_matching_validations = 3
                            if task.settings_json:
                                task_settings = json.loads(task.settings_json)
                                if "num_matching_validations" in task_settings:
                                    num_matching_validations = task_settings[
                                        "num_matching_validations"
                                    ]
                        if example.id in validations_by_eid:
                            example_validations = validations_by_eid[example.id]
                        else:
                            example_validations = []

                        if (
                            not example.model_wrong
                            or example.retracted
                            or self.lengthOfFilteredList(
                                lambda validation: validation.label.name == "flagged",
                                example_validations,
                            )
                            >= num_matching_validations
                            or self.lengthOfFilteredList(
                                lambda validation: validation.label.name == "incorrect",
                                example_validations,
                            )
                            >= num_matching_validations
                            or self.lengthOfFilteredList(
                                lambda validation: validation.label.name == "flagged"
                                and validation.mode.name == "owner",
                                example_validations,
                            )
                            >= 1
                            or self.lengthOfFilteredList(
                                lambda validation: validation.label.name == "incorrect"
                                and validation.mode.name == "owner",
                                example_validations,
                            )
                            >= 1
                        ):
                            example_streak_count = 0
                        else:
                            example_streak_count += 1
                            one_day_passed = previous_example_day + datetime.timedelta(
                                days=1
                            )
                            two_days_passed = previous_example_day + datetime.timedelta(
                                days=2
                            )
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
                                    "EXAMPLE_STREAK_" + str(example_streak_count)
                                )
                    user.streak_examples = example_streak_count
                    user.streak_days = day_streak_count

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

                    num_created_by_task = self.getFieldsFromMetadata(
                        metadata,
                        0,
                        [
                            task_name + "_fooling_no_verified_incorrect_or_flagged"
                            for task_name in self.task_shortname_to_badge_name
                        ],
                    )

                    for (
                        contributor_type,
                        num_required_creations,
                        _,
                    ) in self.contributor_type_num_required_creations_and_validations:
                        if badge.name == "DYNABENCH_" + contributor_type:
                            if sum(num_created_by_task) < num_required_creations:
                                badges_to_remove.append(badge)

                    if badge.name == "ALL_TASKS_COVERED" and 0 in num_created_by_task:
                        badges_to_remove.append(badge)

                    for task_name in self.task_shortname_to_badge_name:
                        for (
                            contributor_type,
                            num_required_creations,
                        ) in self.task_contributor_type_and_num_required_creations:
                            if (
                                badge.name
                                == "DYNABENCH_"
                                + self.task_shortname_to_badge_name[task_name]
                                + "_"
                                + contributor_type
                            ):
                                if (
                                    task_name
                                    + "_fooling_no_verified_incorrect_or_flagged"
                                    in metadata
                                ):
                                    if (
                                        metadata[
                                            task_name
                                            + "_fooling_no_verified_incorrect_"
                                            + "or_flagged"
                                        ]
                                        < num_required_creations
                                    ):
                                        badges_to_remove.append(badge)
                                else:
                                    badges_to_remove.append(badge)

            else:
                badges_and_examples_by_uid[user.id] = {"badges": [], "examples": []}

            # Award streak badges that result from the removal of other streak badges.
            # (e.g., if a 20 example streak is undeserved, a 5 example streak might
            # be deserved instead)
            for badge_name in recomputed_example_streak_badge_names:
                async_badges_to_award.append(badge_name)
            for badge_name in recomputed_day_streak_badge_names:
                async_badges_to_award.append(badge_name)

            # Award badges that must be computed asynchronously.
            if user.total_verified_fooled > 0 and "FIRST_VALIDATED_FOOLING" not in [
                badge.name for badge in badges_and_examples_by_uid[user.id]["badges"]
            ]:
                async_badges_to_award.append("FIRST_VALIDATED_FOOLING")

            if (
                len(badges_and_examples_by_uid[user.id]["examples"]) > 1
                and badges_and_examples_by_uid[user.id]["examples"][
                    -1
                ].generated_datetime
                - badges_and_examples_by_uid[user.id]["examples"][0].generated_datetime
                > datetime.timedelta(days=1)
                and "FIRST_STEPS"
                not in [
                    badge.name
                    for badge in badges_and_examples_by_uid[user.id]["badges"]
                ]
            ):
                async_badges_to_award.append("FIRST_STEPS")

            if user.id in weekly_winners and datetime.date.today().weekday() == 0:
                async_badges_to_award.append("WEEKLY_WINNER")

            for name in async_badges_to_award:
                badges_to_add.append(self._badgeobj(user.id, name))

            if "async_badges_to_award" not in metadata:
                metadata["async_badges_to_award"] = async_badges_to_award
            else:
                metadata["async_badges_to_award"] += async_badges_to_award
            user.metadata_json = json.dumps(metadata)

        self.createNotificationsAndRemoveBadges(
            badges_to_remove, "BADGE_REMOVED_STREAK"
        )
        self.createNotificationsAndAddBadges(badges_to_add)
        print("Completed job")

    def handleUnpublishModel(self, user, model):
        self.incrementUserMetadataField(
            user, model.task.shortname + "_models_published", -1
        )

        badges_to_remove = []
        existing_badges = self.getByUid(user.id)
        models_published = self.getFieldsFromMetadata(
            json.loads(user.metadata_json),
            0,
            [
                task_name + "_models_published"
                for task_name in self.task_shortname_to_badge_name
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
                badges_to_remove.append(badge)
        self.createNotificationsAndRemoveBadges(badges_to_remove, "BADGE_REMOVED_MODEL")

    def handlePublishModel(self, user, model):
        self.incrementUserMetadataField(
            user, model.task.shortname + "_models_published"
        )

        badges_to_add = []
        existing_badges = self.getByUid(user.id)

        # SOTA badge
        if (
            self.lengthOfFilteredList(
                lambda badge: badge.name == "SOTA"
                and json.loads(badge.metadata_json)["mid"] == model.id,
                existing_badges,
            )
            == 0
        ):
            sm = ScoreModel()
            rm = RoundModel()
            scores = sm.getByMid(model.id)
            for score in scores:
                round = rm.get(score.r_realid)
                if model.id == sm.getOverallModelPerfByTask(round.tid)[0][0][0]:
                    badges_to_add.append(
                        self._badgeobj(user.id, "SOTA", json.dumps({"mid": model.id}))
                    )
                    break

                if (
                    model.id
                    == sm.getModelPerfByTidAndRid(round.tid, round.rid)[0][0][0]
                ):
                    badges_to_add.append(
                        self._badgeobj(user.id, "SOTA", json.dumps({"mid": model.id}))
                    )
                    break

        models_published = self.getFieldsFromMetadata(
            json.loads(user.metadata_json),
            0,
            [
                task_name + "_models_published"
                for task_name in self.task_shortname_to_badge_name
            ],
        )
        models_published_sum = sum(models_published)

        # SERIAL_PREDICTOR badge
        if (
            self.lengthOfFilteredList(
                lambda badge: badge.name == "SERIAL_PREDICTOR", existing_badges
            )
            == 0
        ):
            if models_published_sum > 1:
                badges_to_add.append(self._badgeobj(user.id, "SERIAL_PREDICTOR"))

        # MODEL_BUILDER badge
        if (
            self.lengthOfFilteredList(
                lambda badge: badge.name == "MODEL_BUILDER", existing_badges
            )
            == 0
        ):
            if models_published_sum > 0:
                badges_to_add.append(self._badgeobj(user.id, "MODEL_BUILDER"))

        # MULTITASKER badge
        if (
            self.lengthOfFilteredList(
                lambda badge: badge.name == "MULTITASKER", existing_badges
            )
            == 0
        ):
            if 0 not in models_published:
                badges_to_add.append(self._badgeobj(user.id, "MULTITASKER"))

        self.createNotificationsAndAddBadges(badges_to_add)
        return [badge["name"] for badge in badges_to_add]

    def handleHomePage(self, user):
        badge_names = []

        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            if "async_badges_to_award" in metadata:
                for name in metadata["async_badges_to_award"]:
                    badge_names.append(name)
                metadata["async_badges_to_award"] = []
                user.metadata_json = json.dumps(metadata)
                self.dbs.commit()

        return badge_names

    def handleCreateInterface(self, user, example):
        badge_names_to_add = []
        user.examples_submitted += 1
        streak_days_increased = False
        if example.model_wrong:
            self.incrementUserMetadataField(
                user,
                example.context.round.task.shortname
                + "_fooling_no_verified_incorrect_or_flagged",
            )
            user.streak_examples += 1
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

        # beginner badges
        if user.examples_submitted == 1:
            badge_names_to_add.append("FIRST_CREATED")
        if user.examples_submitted == 10:
            badge_names_to_add.append("FIRST_TEN_CREATED")

        # Contributor badges
        existing_badges = self.getByUid(user.id)
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            for task_name in self.task_shortname_to_badge_name:
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
                            and self.lengthOfFilteredList(
                                lambda badge: badge.name
                                == "DYNABENCH_"
                                + self.task_shortname_to_badge_name[task_name]
                                + "_"
                                + contributor_type,
                                existing_badges,
                            )
                            == 0
                        ):
                            badge_names_to_add.append(
                                "DYNABENCH_"
                                + self.task_shortname_to_badge_name[task_name]
                                + "_"
                                + contributor_type
                            )

            num_created_by_task = self.getFieldsFromMetadata(
                metadata,
                0,
                [
                    task_name + "_fooling_no_verified_incorrect_or_flagged"
                    for task_name in self.task_shortname_to_badge_name
                ],
            )
            num_validated_by_task = self.getFieldsFromMetadata(
                metadata,
                0,
                [
                    task_name + "_validated"
                    for task_name in self.task_shortname_to_badge_name
                ],
            )

            for (
                contributor_type,
                num_creations_required,
                num_validations_required,
            ) in self.contributor_type_num_required_creations_and_validations:
                if (
                    sum(num_created_by_task) >= num_creations_required
                    and sum(num_validated_by_task) >= num_validations_required
                    and self.lengthOfFilteredList(
                        lambda badge: badge.name == "DYNABENCH_" + contributor_type,
                        existing_badges,
                    )
                    == 0
                ):
                    badge_names_to_add.append("DYNABENCH_" + contributor_type)

            if (
                0 not in num_created_by_task + num_validated_by_task
                and self.lengthOfFilteredList(
                    lambda badge: badge.name == "ALL_TASKS_COVERED", existing_badges
                )
                == 0
            ):
                badge_names_to_add.append("ALL_TASKS_COVERED")

        # Example streaks
        for num_required in self.example_streak_num_required:
            if user.streak_examples == num_required:
                badge_names_to_add.append("EXAMPLE_STREAK_" + str(num_required))

        # Day streaks
        if streak_days_increased:
            for streak_type, num_required in self.day_streak_type_and_num_required_days:
                if user.streak_days == num_required:
                    badge_names_to_add.append("DAY_STREAK_" + streak_type)

        badges_to_add = [self._badgeobj(user.id, name) for name in badge_names_to_add]
        self.createNotificationsAndAddBadges(badges_to_add)
        return badge_names_to_add

    def handleValidateInterface(self, user, example):
        self.incrementUserMetadataField(
            user, example.context.round.task.shortname + "_validated"
        )
        badge_names_to_add = []
        existing_badges = self.getByUid(user.id)

        # Validate beginner badges
        if user.examples_verified == 1:
            badge_names_to_add.append("FIRST_VERIFIED")

        # Contributor badges
        if user.metadata_json:
            metadata = json.loads(user.metadata_json)
            num_created_by_task = self.getFieldsFromMetadata(
                metadata,
                0,
                [
                    task_name + "_fooling_no_verified_incorrect_or_flagged"
                    for task_name in self.task_shortname_to_badge_name
                ],
            )
            num_validated_by_task = self.getFieldsFromMetadata(
                metadata,
                0,
                [
                    task_name + "_validated"
                    for task_name in self.task_shortname_to_badge_name
                ],
            )
            if (
                0 not in num_created_by_task + num_validated_by_task
                and self.lengthOfFilteredList(
                    lambda badge: badge.name == "ALL_TASKS_COVERED", existing_badges
                )
                == 0
            ):
                badge_names_to_add.append("ALL_TASKS_COVERED")
            for (
                contributor_type,
                num_creations_required,
                num_validations_required,
            ) in self.contributor_type_num_required_creations_and_validations:
                if (
                    sum(num_created_by_task) >= num_creations_required
                    and sum(num_validated_by_task) >= num_validations_required
                    and self.lengthOfFilteredList(
                        lambda badge: badge.name == "DYNABENCH_" + contributor_type,
                        existing_badges,
                    )
                    == 0
                ):
                    badge_names_to_add.append("DYNABENCH_" + contributor_type)

        badges_to_add = [self._badgeobj(user.id, name) for name in badge_names_to_add]
        self.createNotificationsAndAddBadges(badges_to_add)
        return badge_names_to_add
