# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add log access type to datasets.
"""

from yoyo import step


__depends__ = {"20211220_01_I8aZI-redo-evaluation-status"}

steps = [
    step(
        """
        ALTER TABLE datasets ADD COLUMN log_access_type
        ENUM('owner', 'user')
        DEFAULT "owner"
        """,
        "ALTER TABLE datasets DROP log_access_type",
    ),
]
