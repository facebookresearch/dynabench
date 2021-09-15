# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add task proposals table, also change
"""

from yoyo import step


__depends__ = {"20210910_01_Gr6cJ-add-metrics-to-annotation-config"}

steps = [
    step(
        """
        CREATE TABLE task_proposals (
            id INT NOT NULL AUTO_INCREMENT,
            uid INT NOT NULL,
            task_code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL UNIQUE,
            `desc` VARCHAR(255),
            `longdesc` TEXT,

            PRIMARY KEY (id),
            CONSTRAINT task_proposals_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
        """,
        "DROP TABLE task_proposals",
    ),
    step(
        "ALTER TABLE tasks CHANGE COLUMN hidden hidden BOOL DEFAULT true",
        "ALTER TABLE tasks CHANGE COLUMN hidden hidden BOOL DEFAULT false",
    ),
]
