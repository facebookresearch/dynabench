"""
add-leaderboard-configurations-table
"""

from yoyo import step

__depends__ = {"20210630_01_ZczVK-make-task-code-required"}

steps = [
    step(
        """
        CREATE TABLE leaderboard_configurations (
            tid INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            uid INT NOT NULL,
            created DATETIME DEFAULT NULL,
            configuration_json TEXT NOT NULL,
            PRIMARY KEY (name, tid),
            CONSTRAINT leaderboard_configurations_tid FOREIGN KEY (tid) REFERENCES tasks (id),
            CONSTRAINT leaderboard_configurations_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
        """,
        "DROP TABLE leaderboard_configurations",
    )
]
