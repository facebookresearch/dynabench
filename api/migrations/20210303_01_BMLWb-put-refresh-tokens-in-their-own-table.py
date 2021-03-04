# Copyright (c) Facebook, Inc. and its affiliates.

"""
Put refresh_tokens in their own table
"""

from yoyo import step


__depends__ = {"20210224_02_yTRsk-add-aws-metrics-to-scores-table"}

steps = [
    step(
        "ALTER TABLE users DROP COLUMN refresh_token",
        "ALTER TABLE users ADD COLUMN refresh_token VARCHAR(255)",
    ),
    step(
        """
        CREATE TABLE refresh_tokens (
            id INT NOT NULL AUTO_INCREMENT,
            token VARCHAR(255) NOT NULL,
            uid INT NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY (token),
            KEY tid (uid),
            CONSTRAINT refresh_tokens_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
    """,
        "DROP TABLE refresh_tokens",
    ),
]
