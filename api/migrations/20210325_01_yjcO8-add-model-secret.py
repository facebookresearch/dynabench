# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add model secret
"""

from yoyo import step


__depends__ = {
    "20210323_01_24BIL-set-score-did",
    "20210324_01_PeO56-use-seconds-per-example-in-scores-table-instead",
}

steps = [
    step(
        """
        ALTER TABLE models ADD COLUMN secret TEXT
        """,
        "ALTER TABLE model DROP COLUMN secret",
    )
]
