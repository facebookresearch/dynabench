# Copyright (c) Facebook, Inc. and its affiliates.

"""
remove s3_uri and endpoint_url from models table
"""

from yoyo import step


__depends__ = {"20210203_01_zNCXS-add-task-code"}

steps = [
    step(
        "ALTER TABLE models DROP COLUMN s3_uri, DROP COLUMN endpoint_url",
        "ALTER TABLE models ADD COLUMN s3_uri TEXT, ADD COLUMN endpoint_url TEXT",
    )
]
