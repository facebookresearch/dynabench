# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Adding tag hierarchy json to Dataset model
"""

from yoyo import step


__depends__ = {"20211006_01_DeVEP-big-data-changes"}

steps = [
    step(
        "ALTER TABLE datasets ADD COLUMN tag_hierarchy TEXT",
        "ALTER TABLE datasets DROP COLUMN tag_hierarchy",
    )
]
