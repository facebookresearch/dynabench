# Copyright (c) Facebook, Inc. and its affiliates.

"""
Replace models table upload_date with DateTime (previously Date) and insert a
date for NULL values.
"""

from yoyo import step


__depends__ = {"20210111_01_XmZj0-add-model-aws-information"}

steps = [
    step(
        "ALTER TABLE models Change upload_date upload_datetime DateTime",
        "ALTER TABLE models Change upload_datetime upload_date Date",
    ),
    step(
        "UPDATE models SET upload_datetime='2020-09-09' WHERE upload_datetime is NULL",
        "UPDATE models SET upload_datetime=NULL WHERE upload_datetime='2020-09-09'",
    ),
]
