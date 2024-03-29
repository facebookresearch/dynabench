# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
add-desc-to-leaderboard-fork
"""

from yoyo import step


__depends__ = {
    "20210723_01_PTI5B-add-leaderboard-snapshots-table",
    "20210730_01_02Na6-change-example-metadata-json-type-to-mediumtext",
}

steps = [
    step(
        "ALTER TABLE leaderboard_configurations ADD COLUMN `desc` TEXT DEFAULT NULL",
        "ALTER TABLE leaderboard_configurations DROP COLUMN `desc`",
    )
]
