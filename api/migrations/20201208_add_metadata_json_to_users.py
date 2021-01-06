# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add metadata_json to users
"""

from yoyo import step


__depends__ = {}

steps = [
    step(
        "ALTER TABLE users ADD COLUMN metadata_json TEXT",
        "ALTER TABLE users DROP COLUMN metadata_json",
    )
]
