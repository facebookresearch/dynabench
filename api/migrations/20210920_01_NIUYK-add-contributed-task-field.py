# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add contributed task field
"""

from yoyo import step


__depends__ = {"20210915_01_f1gBY-change-round-url-to-nullable-text"}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN official BOOL DEFAULT false",
        "ALTER TABLE tasks DROP official",
    ),
    step(
        """UPDATE tasks SET official=true WHERE task_code in
        ('nli', 'qa', 'sentiment', 'hs')"""
    ),
]
