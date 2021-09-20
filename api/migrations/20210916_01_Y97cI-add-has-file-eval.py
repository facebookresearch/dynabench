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
        "ALTER TABLE tasks ADD COLUMN has_predictions_upload BOOLEAN DEFAULT false",
        "ALTER TABLE tasks DROP has_predictions_upload",
    ),
    step(
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown", "predictions_upload")
        DEFAULT "unknown"
        """,
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown")
        DEFAULT "unknown"
        """,
    ),
    step("UPDATE tasks SET has_predictions_upload=1 WHERE task_code='vqa' limit 1"),
]
