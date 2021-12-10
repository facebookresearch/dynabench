# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add standard deviation for perf metric to scores table, and train file upload
instructions.
"""

from yoyo import step


__depends__ = {"20211006_01_DeVEP-big-data-changes"}

steps = [
    step(
        "ALTER TABLE scores ADD COLUMN perf_std FLOAT DEFAULT NULL",
        "ALTER TABLE scores DROP perf_std",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN train_file_upload_instructions_md TEXT",
        "ALTER TABLE tasks DROP train_file_upload_instructions_md",
    ),
]
