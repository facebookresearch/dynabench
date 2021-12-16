# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Adding a new table to the rounds table with a selected_rounds column
"""

from yoyo import step


__depends__ = {"20211103_01_pdUwN-add-placeholder-validation"}

steps = [
    step(
        "ALTER TABLE rounds ADD COLUMN selected_tags TEXT",
        "ALTER TABLE rounds DROP COLUMN selected_tags",
    ),
]
