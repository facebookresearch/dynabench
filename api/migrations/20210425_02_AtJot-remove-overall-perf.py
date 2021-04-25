# Copyright (c) Facebook, Inc. and its affiliates.

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
