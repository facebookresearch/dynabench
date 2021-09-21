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
        "ALTER TABLE tasks ADD COLUMN predictions_upload_instructions_md TEXT",
        "ALTER TABLE tasks DROP predictions_upload_instructions_md",
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
    step(
        """
        ALTER TABLE models ADD COLUMN evaluation_status
        ENUM('evaluating', 'completed', 'failed', 'pre_evaluation')
        DEFAULT "pre_evaluation"
        """,
        "ALTER TABLE models DROP evaluation_status",
    ),
    step(
        """UPDATE models SET evaluation_status='failed' WHERE
        deployment_status='takendown'"""
    ),
    step(
        """UPDATE models SET evaluation_status='completed' WHERE
        deployment_status in ('created', 'deployed')"""
    ),
    step("UPDATE tasks SET has_predictions_upload=1 WHERE task_code='vqa' limit 1"),
]
