# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add task submitable status
"""

from yoyo import step


__depends__ = {
    "20210503_01_xxxx-add-flores-task",
    "20210519_01_uS2nw-add-model-status-for-only-model-created",
}

steps = [
    step(
        """
        ALTER TABLE tasks ADD submitable BOOL DEFAULT false
        """,
        """
        ALTER TABLE tasks DROP submitable
        """,
    ),
    step(
        """
        UPDATE tasks SET submitable = true WHERE task_code
        IN ("nli", "qa", "hs", "sentiment")
        """,
        """
        UPDATE tasks SET submitable = false WHERE task_code
        IN ("nli", "qa", "hs", "sentiment")
        """,
    ),
]
