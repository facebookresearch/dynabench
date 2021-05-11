# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add URL field to models table.
"""

from yoyo import step


__depends__ = {"20210505_01_frwye-populate-dataset-desc-and-link"}

steps = [
    step("ALTER TABLE models ADD source_url Text", "ALTER TABLE models DROP source_url")
]
