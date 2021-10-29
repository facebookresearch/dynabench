# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Adding last_used column to models
"""

from yoyo import step


__depends__ = {
    "20211006_01_DeVEP-big-data-changes",
    "20211010_01_2P6E7-add-is-anonymous-column-to-model",
}

steps = [
    step(
        "ALTER TABLE models ADD COLUMN last_used DATETIME",
        "ALTER TABLE models DROP COLUMN last_used",
    )
]
