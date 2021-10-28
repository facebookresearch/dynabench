# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
add is_anonymous column to model
"""

from yoyo import step


__depends__ = {"20210929_01_AKPlZ-update-qa-f1-threshold-to-0-4"}

steps = [
    step(
        "ALTER TABLE models ADD COLUMN is_anonymous BOOL DEFAULT false",
        "ALTER TABLE models DROP is_anonymous",
    )
]
