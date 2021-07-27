"""
Add detached model status
"""

from yoyo import step

__depends__ = {'20210630_01_s8Xod-update-model-url-to-authorized-endpoint', '20210706_01_a9a26-fix-flores-description', '20210714_01_Fbdh6-add_flores_unpublished_dynaboard_setting'}

steps = [
    step(
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown",
        'detached')
        DEFAULT "unknown"
        """,
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown")
        DEFAULT "unknown"
        """,
    )
]
