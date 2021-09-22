# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
add-name-to-leaderboard-snapshot
"""

from yoyo import step


__depends__ = {
    "20210806_01_0LQae-adding-limiting-behavior-of-adc-task",
    "20210808_01_OtRTz-add-desc-to-leaderboard-fork",
}

steps = [
    step(
        "ALTER TABLE leaderboard_snapshots ADD COLUMN name VARCHAR(255) NOT NULL",
        "ALTER TABLE leaderboard_snapshots DROP COLUMN name",
    ),
    step(
        "ALTER TABLE leaderboard_snapshots ADD CONSTRAINT "
        + "unique_tid_name_pair UNIQUE (tid, name)",
        "ALTER TABLE leaderboard_snapshots DROP INDEX unique_tid_name_pair",
    ),
]
