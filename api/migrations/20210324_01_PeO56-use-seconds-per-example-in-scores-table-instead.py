# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Use seconds per example in scores table instead
"""

from yoyo import step


__depends__ = {
    (
        "20210319_01_XZqJf-update-the-number-of-total-fooling-"
        "examples-for-round-one-in-vqa-task"
    )
}

steps = [
    step(
        """
        UPDATE scores SET examples_per_second = 1 / examples_per_second
        where examples_per_second IS NOT NULL
        """,
        """
        UPDATE scores SET examples_per_second = 1 / examples_per_second
        where examples_per_second IS NOT NULL
        """,
    ),
    step(
        """
        ALTER TABLE scores CHANGE examples_per_second seconds_per_example FLOAT
        """,
        """
        ALTER TABLE scores CHANGE seconds_per_example examples_per_second FLOAT
        """,
    ),
]
