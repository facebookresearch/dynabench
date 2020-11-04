# Copyright (c) Facebook, Inc. and its affiliates.

"""
add model card
"""

from yoyo import step


__depends__ = {
    "20201028_01_If0vq-add-api-token-to-users",
    "20201101_add-settings-json-to-tasks",
}

steps = [
    step(
        "ALTER TABLE models ADD COLUMN params BIGINT, ADD COLUMN languages TEXT, \
         ADD COLUMN license TEXT, ADD COLUMN upload_date DATE, \
         ADD COLUMN model_card TEXT",
        "ALTER TABLE models DROP COLUMN params, DROP COLUMN languages, DROP COLUMN license, \
         DROP COLUMN upload_date, DROP COLUMN model_card",
    )
]
