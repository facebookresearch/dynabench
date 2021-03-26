# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add dataset type
"""

from yoyo import step


__depends__ = {
    "20210323_01_24BIL-set-score-did",
    "20210324_01_PeO56-use-seconds-per-example-in-scores-table-instead",
}

steps = [
    step(
        """
        ALTER TABLE datasets ADD COLUMN access_type
        ENUM('scoring', 'standard', 'hidden') DEFAULT 'scoring'
        """,
        """
        ALTER TABLE datasets DROP COLUMN access_type
        """,
    )
]
