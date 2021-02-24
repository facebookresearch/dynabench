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
        ADD COLUMN memory_utilization FLOAT COMMENT 'Unit: GiB',
        ADD COLUMN examples_per_second FLOAT
        """,
        """
        ALTER TABLE scores DROP COLUMN memory_utilization,
        DROP COLUMN examples_per_second
        """,
    )
]
