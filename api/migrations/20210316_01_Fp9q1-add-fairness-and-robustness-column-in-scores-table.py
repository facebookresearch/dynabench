# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add fairness and robustness column in scores table
"""

from yoyo import step


__depends__ = {
    "20210303_01_BMLWb-put-refresh-tokens-in-their-own-table",
    "20210303_02_vVPzx-modify-description-message-for-vqa-val",
    "20210305_01_KyKze-add-outupt-s3-path-in-scores-table",
}

steps = [
    step(
        """
        ALTER TABLE scores ADD COLUMN fairness FLOAT
        COMMENT 'raw perf metric on fairness perturbed dataset',
        ADD COLUMN robustness FLOAT
        COMMENT 'raw perf metric on robustness perturbed datast'
        """,
        "ALTER TABLE scores DROP COLUMN fairness FLOAT, DROP COLUMN robustness FLOAT",
    )
]
