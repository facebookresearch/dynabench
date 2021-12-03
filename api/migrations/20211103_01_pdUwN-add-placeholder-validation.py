# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add placeholder label to validations. Used to prevent a user from validating an example.
"""

from yoyo import step


__depends__ = {"20211028_01_ukEWR-adding-taken-down-non-active-enum"}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN unique_validators_for_example_tags BOOL DEFAULT"
        + " false",
        "ALTER TABLE tasks DROP unique_validators_for_example_tags",
    ),
    step(
        """
        ALTER TABLE validations MODIFY label
        ENUM('flagged','correct','incorrect','placeholder')
        """,
        """
         ALTER TABLE validations MODIFY label
        ENUM('flagged','correct','incorrect')
        """,
    ),
]
