# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
        "UPDATE tasks SET task_code='nli' WHERE shortname='NLI'",
        "UPDATE tasks SET task_code=NULL WHERE shortname='NLI'",
    ),
    step(
        "UPDATE tasks SET task_code='qa' WHERE shortname='QA'",
        "UPDATE tasks SET task_code=NULL where shortname='QA'",
    ),
    step(
        "UPDATE tasks SET task_code='sentiment' WHERE shortname='Sentiment'",
        "UPDATE tasks SET task_code=NULL WHERE shortname='Sentiment'",
    ),
    step(
        "UPDATE tasks SET task_code='hs' WHERE shortname='Hate Speech'",
        "UPDATE tasks SET task_code=NULL WHERE shortname='Hate Speech'",
    ),
    step(
        "UPDATE tasks SET task_code='vqa' WHERE shortname='VQA'",
        "UPDATE tasks SET task_code=NULL WHERE shortname='VQA'",
    ),
]
