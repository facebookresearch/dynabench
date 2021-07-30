# Copyright (c) Facebook, Inc. and its affiliates.

"""
Change example metadata_json type from TEXT to LONGTEXT
"""

from yoyo import step


__depends__ = {
    "20210630_01_s8Xod-update-model-url-to-authorized-endpoint",
    "20210706_01_a9a26-fix-flores-description",
    "20210714_01_Fbdh6-add_flores_unpublished_dynaboard_setting",
}

steps = [
    step("ALTER TABLE examples MODIFY metadata_json LONGTEXT"),
    step("ALTER TABLE examples MODIFY metadata_json TEXT"),
]
