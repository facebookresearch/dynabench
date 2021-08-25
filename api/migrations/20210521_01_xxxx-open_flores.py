# Copyright (c) Facebook, Inc. and its affiliates.

"""
Hide Flores task until June 4th, 2021.
"""
from datetime import datetime, timezone

from yoyo import step


__depends__ = {
    "20210503_01_xxxx-add-flores-task",
    "20210520_01_tOL8u-add-task-submitable-status",
}


tasks = "('flores_small1', 'flores_small2', 'flores_full')"

step(
    f"""
    UPDATE tasks SET hidden = true, submitable = true
    WHERE task_code in {tasks}
    """,
    f"""
    UPDATE tasks SET hidden = false, submitable = false
    WHERE task_code in {tasks}
    """,
)
