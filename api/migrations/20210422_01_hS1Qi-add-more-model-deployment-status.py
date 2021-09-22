# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add more model deployment statuses
"""

from yoyo import step


__depends__ = {
    "20210325_01_yjcO8-add-model-secret",
    "20210402_01_Wvb4j-use-examples-per-second-in-scores-table",
}

steps = [
    step(
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed', 'failed', 'unknown', "takendown")
        DEFAULT "unknown"
        """,
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed', 'failed', 'unknown')
        DEFAULT NULL
        """,
    )
]
