# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
