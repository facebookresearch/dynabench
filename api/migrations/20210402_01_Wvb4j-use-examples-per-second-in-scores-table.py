# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Use examples per second in scores table instead
"""

from yoyo import step


__depends__ = {("20210326_01_rCLpg-add-dataset-type")}

steps = [
    step(
        """
        UPDATE scores SET seconds_per_example = 1 / seconds_per_example
        where seconds_per_example IS NOT NULL
        """,
        """
        UPDATE scores SET seconds_per_example = 1 / seconds_per_example
        where seconds_per_example IS NOT NULL
        """,
    ),
    step(
        """
        ALTER TABLE scores CHANGE seconds_per_example examples_per_second FLOAT
        """,
        """
        ALTER TABLE scores CHANGE examples_per_second seconds_per_example FLOAT
        """,
    ),
]
