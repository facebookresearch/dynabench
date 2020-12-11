# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add api_token to users
"""

from yoyo import step


__depends__ = {}

steps = [
    step(
        "ALTER TABLE contexts ADD COLUMN tag TEXT",
        "ALTER TABLE contexts DROP COLUMN tag",
    ),
    step(
        "ALTER TABLE examples ADD COLUMN tag TEXT",
        "ALTER TABLE examples DROP COLUMN tag",
    ),
]
