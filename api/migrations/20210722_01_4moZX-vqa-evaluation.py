# Copyright (c) Facebook, Inc. and its affiliates.

"""
VQA Evaluation
"""

from yoyo import step


__depends__ = {
    "20210630_01_s8Xod-update-model-url-to-authorized-endpoint",
    "20210714_01_Fbdh6-add_flores_unpublished_dynaboard_setting",
}

steps = [
    step("UPDATE tasks SET submitable=1 WHERE shortname='VQA' limit 1"),
    step("ALTER TABLE tasks ADD COLUMN has_file_eval BOOLEAN DEFAULT false"),
    step("UPDATE tasks SET has_file_eval=1 WHERE shortname='VQA' limit 1"),
]
