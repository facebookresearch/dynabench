# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add dataset type
"""

from yoyo import step


__depends__ = {
    "20210323_01_24BIL-set-score-did",
    "20210324_01_PeO56-use-seconds-per-example-in-scores-table-instead",
}

steps = [
    step(
        """
        ALTER TABLE datasets ADD COLUMN access_type
        ENUM('scoring', 'standard', 'hidden') DEFAULT 'scoring'
        """,
        """
        ALTER TABLE datasets DROP COLUMN access_type
        """,
    ),
    # for backward compatibility, setting all dev sets to standard
    step(
        """
        UPDATE datasets SET access_type = 'standard' WHERE
        name LIKE '%-dev-%' OR
        name LIKE '%-dev' OR
        name LIKE 'dev-%'
        """,
        """
        UPDATE datasets SET access_type = 'scoring' WHERE
        name LIKE '%-dev-%' OR
        name LIKE '%-dev' OR
        name LIKE 'dev-%'
        """,
    ),
]
