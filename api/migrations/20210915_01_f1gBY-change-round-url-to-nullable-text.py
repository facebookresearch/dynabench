# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Change URL to text that is nullable.
"""

from yoyo import step


__depends__ = {"20210913_01_er15U-add-task-proposals-table"}

steps = [
    step(
        "ALTER TABLE rounds CHANGE COLUMN url url TEXT DEFAULT NULL",
        "ALTER TABLE rounds CHANGE COLUMN url url VARCHAR(255) NOT NULL",
    )
]
