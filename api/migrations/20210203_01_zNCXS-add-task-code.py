# Copyright (c) Facebook, Inc. and its affiliates.

"""
add task code
"""

from yoyo import step


__depends__ = {
    "20210125_01_sksbT-add-starter-contexts-to-sentiment-r1-and-r3-and-hs-r4"
}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN task_code VARCHAR(255) "
        + "COMMENT 'unique readable task identifier, "
        + "lower case letters only, used as folder name on S3'",
        "ALTER TABLE tasks DROP COLUMN task_code",
    ),
    step(
        "ALTER TABLE tasks ADD CONSTRAINT task_code UNIQUE (task_code)",
        "ALTER TABLE tasks DROP INDEX task_code",
    ),
    step(
        "UPDATE tasks SET task_code='nli' WHERE id=1",
        "UPDATE tasks SET task_code=NULL WHERE id=1",
    ),
    step(
        "UPDATE tasks SET task_code='qa' WHERE id=2",
        "UPDATE tasks SET task_code=NULL where id=2",
    ),
    step(
        "UPDATE tasks SET task_code='sentiment' WHERE id=3",
        "UPDATE tasks SET task_code=NULL WHERE id=3",
    ),
    step(
        "UPDATE tasks SET task_code='hs' WHERE id=5",
        "UPDATE tasks SET task_code=NULL WHERE id=5",
    ),
]
