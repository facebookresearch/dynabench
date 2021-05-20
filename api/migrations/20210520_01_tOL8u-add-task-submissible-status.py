# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add task submissible status
"""

from yoyo import step


__depends__ = {
    "20210503_01_xxxx-add-flores-task",
    "20210519_01_uS2nw-add-model-status-for-only-model-created",
}

steps = [
    step(
        """
        ALTER TABLE tasks ADD submissible BOOL DEFAULT false
        """,
        """
        ALTER TABLE tasks DROP submissible
        """,
    ),
    step(
        """
        UPDATE tasks SET submissible = true WHERE task_code
        IN ("nli", "qa", "hs", "sentiment")
        """,
        """
        UPDATE tasks SET submissible = false WHERE task_code
        IN ("nli", "qa", "hs", "sentiment")
        """,
    ),
]
