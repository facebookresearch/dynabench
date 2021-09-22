# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add outupt s3 path in scores table
"""

from yoyo import step


__depends__ = {"20210224_02_yTRsk-add-aws-metrics-to-scores-table"}

steps = [
    step(
        """
        ALTER TABLE scores ADD COLUMN raw_output_s3_uri TEXT
        """,
        """
        ALTER TABLE scores DROP COLUMN raw_output_s3_uri
        """,
    )
]
