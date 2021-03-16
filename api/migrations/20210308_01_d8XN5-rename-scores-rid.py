# Copyright (c) Facebook, Inc. and its affiliates.

"""
Rename rid in scores table to r_realid for consistency.
"""

from yoyo import step


__depends__ = {"20210305_01_KyKze-add-outupt-s3-path-in-scores-table"}

steps = [
    step(
        "ALTER TABLE scores DROP FOREIGN KEY scores_ibfk_2",
        """
        ALTER TABLE scores
        ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`rid`)
        REFERENCES `rounds` (`id`)
        """,
    ),
    step(
        "ALTER TABLE scores DROP CONSTRAINT ck_data_exist",
        """
        ALTER TABLE scores ADD CONSTRAINT ck_data_exist
        CHECK ((rid<>0) OR (NOT did IS NULL))
        """,
    ),
    step(
        "ALTER TABLE scores RENAME COLUMN rid TO r_realid",
        "ALTER TABLE scores RENAME COLUMN r_realid TO rid",
    ),
    step(
        """
        ALTER TABLE scores ADD CONSTRAINT ck_data_exist
        CHECK ((r_realid<>0) OR (NOT did IS NULL))
        """,
        "ALTER TABLE scores DROP CONSTRAINT ck_data_exist",
    ),
    step(
        """
        ALTER TABLE scores ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`r_realid`)
        REFERENCES `rounds` (`id`)
        """,
        "ALTER TABLE scores DROP FOREIGN KEY scores_ibfk_2",
    ),
]
