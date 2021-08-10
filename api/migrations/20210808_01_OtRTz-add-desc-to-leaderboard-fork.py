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
