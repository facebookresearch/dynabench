# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Redo evaluation_status to be specific to datasets.
"""

from yoyo import step


__depends__ = {
    "20211026_01_scyfj-support-dataperf",
    "20211103_01_pdUwN-add-placeholder-validation",
}

steps = [
    step(
        "ALTER TABLE models DROP evaluation_status",
        """
        ALTER TABLE models ADD COLUMN evaluation_status
        ENUM('evaluating', 'completed', 'failed', 'pre_evaluation')
        DEFAULT "pre_evaluation"
        """,
    ),
    step(
        """
        ALTER TABLE models ADD COLUMN evaluation_status_json TEXT
        """,
        "ALTER TABLE models DROP evaluation_status_json",
    ),
]
