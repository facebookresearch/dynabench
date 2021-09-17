# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
VQA Evaluation
"""

from yoyo import step


__depends__ = {"20210915_01_f1gBY-change-round-url-to-nullable-text"}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN has_file_eval BOOLEAN DEFAULT false",
        "ALTER TABLE tasks DROP has_file_eval",
    ),
    step("UPDATE tasks SET has_file_eval=1 WHERE task_code='vqa' limit 1"),
]
