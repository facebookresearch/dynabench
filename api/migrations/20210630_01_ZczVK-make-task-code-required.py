# Copyright (c) Facebook, Inc. and its affiliates.

"""
Make task code required
"""

from yoyo import step


__depends__ = {"20210623_01_nG0YL-add-new-round-for-qa-task"}


steps = [
    # First apply customized task codes to match existing folders on S3
    step(
        """
        UPDATE tasks SET task_code='dkqa' WHERE shortname='DK_QA'
        """,
        """
        UPDATE tasks SET task_code=NULL WHERE shortname='DK_QA'
        """,
    ),
    # for tasks without a folder on S3, or any locally created tasks, no reverse
    step(
        """
        UPDATE tasks SET
        task_code=(REPLACE(REPLACE(LOWER(shortname), " ", "_"), "-", "_"))
        WHERE task_code IS NULL
        """
    ),
    step(
        """
        ALTER TABLE tasks MODIFY `task_code` varchar(255) NOT NULL
        """,
        """
        ALTER TABLE tasks MODIFY `task_code` varchar(255) DEFAULT NULL
        """,
    ),
]
