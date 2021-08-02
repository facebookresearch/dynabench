# Copyright (c) Facebook, Inc. and its affiliates.

"""
add-leaderboard-snapshots-table
"""

from yoyo import step


__depends__ = {
    "20210630_01_s8Xod-update-model-url-to-authorized-endpoint",
    "20210714_01_Fbdh6-add_flores_unpublished_dynaboard_setting",
}

steps = [
    step(
        """
        CREATE TABLE leaderboard_snapshots (
            id INT NOT NULL AUTO_INCREMENT,
            tid INT NOT NULL,
            uid INT NOT NULL,
            description TEXT DEFAULT NULL,
            create_datetime DATETIME DEFAULT NULL,
            data_json LONGTEXT NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT leaderboard_snapshots_tid FOREIGN KEY (tid) REFERENCES tasks (id),
            CONSTRAINT leaderboard_snapshots_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
        """,
        "DROP TABLE leaderboard_snapshots",
    )
]
