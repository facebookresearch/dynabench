# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Remove overall_perf from models table
"""

from yoyo import step


__depends__ = {"20210422_01_hS1Qi-add-more-model-deployment-status"}

steps = [
    step(
        "ALTER TABLE models DROP overall_perf",
        "ALTER TABLE models ADD COLUMN overall_perf TEXT",
    )
]
