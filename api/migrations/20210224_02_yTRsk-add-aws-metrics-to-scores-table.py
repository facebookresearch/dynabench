# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add AWS metrics to scores table
"""

from yoyo import step


__depends__ = {
    "20210211_01_eqp77-add-advqaval",
    "20210211_01_yDiqU-delete-badges-awarded-too-many-times",
}

steps = [
    step(
        """
        ALTER TABLE scores
        ADD COLUMN CPUUtilization FLOAT COMMENT 'Unit: percent',
        ADD COLUMN MemoryUtilization FLOAT COMMENT 'Unit: percent',
        ADD COLUMN Duration FLOAT COMMENT 'Unit: second'
        """,
        """
        ALTER TABLE scores DROP COLUMN CPUUtilization,
        DROP COLUMN MemoryUtilization,
        DROP COLUMN Duration
        """,
    )
]
