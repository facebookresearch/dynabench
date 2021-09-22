# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add dataset table
"""

from yoyo import step


__depends__ = {}

steps = [
    step(
        """
        CREATE TABLE datasets (
            id INT NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            tid INT NOT NULL,
            rid INT DEFAULT 0,
            `desc` VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY (name),
            KEY tid (tid),
            CONSTRAINT datasets_tid FOREIGN KEY (tid) REFERENCES tasks (id)
        )
    """,
        "DROP TABLE datasets",
    )
]
