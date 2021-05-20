# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add model status for only model created
"""

from yoyo import step


__depends__ = {"20210511_01_yYAwF-add-model-link"}

steps = [
    step(
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown")
        DEFAULT "unknown"
        """,
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed', 'failed', 'unknown', 'takendown')
        DEFAULT NULL
        """,
    )
]
