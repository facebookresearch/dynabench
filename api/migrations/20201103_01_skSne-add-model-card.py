# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
