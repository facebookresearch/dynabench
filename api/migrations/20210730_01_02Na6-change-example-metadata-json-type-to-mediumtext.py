# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Change example metadata_json type from TEXT to MEDIUMTEXT
"""

from yoyo import step


__depends__ = {
    "20210630_01_s8Xod-update-model-url-to-authorized-endpoint",
    "20210706_01_a9a26-fix-flores-description",
    "20210714_01_Fbdh6-add_flores_unpublished_dynaboard_setting",
}

steps = [
    step("ALTER TABLE examples MODIFY metadata_json MEDIUMTEXT"),
    step("ALTER TABLE examples MODIFY metadata_json TEXT"),
]
