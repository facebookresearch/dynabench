# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add more model deployment status
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
