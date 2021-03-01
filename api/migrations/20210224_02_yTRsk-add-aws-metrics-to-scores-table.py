# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add AWS metrics to scores table
"""

from yoyo import step


__depends__ = {
    "20210211_01_eqp77-add-advqaval",
    "20210211_01_yDiqU-delete-badges-awarded-too-many-times",
    "20210224_01_fxAds-add-dataset-table",
}

steps = [
    step(
        """
        INSERT INTO tasks (name, shortname, `desc`, cur_round, hidden)
        VALUES ("placeholder", "placeholder",
        "the placeholder for datasets that do not belong to a round of a task",
        0, 1)
        """,
        """
        DELETE FROM tasks WHERE name="placeholder"
        """,
    ),
    step(
        """
        UPDATE tasks SET id=0 WHERE name="placeholder"
        """,
        """
        DELETE FROM tasks WHERE id=0
        """,
    ),
    step(
        """
        INSERT INTO rounds (tid, rid, secret)
        VALUES (0, 0, "this is a placeholder round without secret")
        """,
        """
        DELETE FROM rounds WHERE tid=0
        """,
    ),
    step(
        """
        UPDATE rounds SET id=0 WHERE tid=0
        """,
        """
        DELETE FROM rounds WHERE id=0
        """,
    ),
    step(
        """
        ALTER TABLE scores
        ADD COLUMN did INT,
        ADD COLUMN memory_utilization FLOAT COMMENT 'Unit: GiB',
        ADD COLUMN examples_per_second FLOAT,
        ADD CONSTRAINT dataset_id FOREIGN KEY (did) REFERENCES datasets (id),
        ADD CONSTRAINT ck_data_exist CHECK ((rid<>0) OR (NOT did IS NULL))
        """,
        """
        ALTER TABLE scores
        DROP COLUMN memory_utilization,
        DROP COLUMN examples_per_second,
        DROP CONSTRAINT ck_data_exist,
        DROP FOREIGN KEY dataset_id,
        DROP COLUMN did
        """,
    ),
]
