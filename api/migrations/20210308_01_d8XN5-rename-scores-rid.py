# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Rename rid in scores table to r_realid for consistency.
"""

from yoyo import step


__depends__ = {"20210305_01_KyKze-add-outupt-s3-path-in-scores-table"}

steps = [
    step(
        "ALTER TABLE scores DROP FOREIGN KEY scores_ibfk_2",
        """
        ALTER TABLE scores
        ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`rid`)
        REFERENCES `rounds` (`id`)
        """,
    ),
    step(
        "ALTER TABLE scores CHANGE rid r_realid INT",
        "ALTER TABLE scores CHANGE r_realid rid INT",
    ),
    step(
        """
        ALTER TABLE scores ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`r_realid`)
        REFERENCES `rounds` (`id`)
        """,
        "ALTER TABLE scores DROP FOREIGN KEY scores_ibfk_2",
    ),
]
