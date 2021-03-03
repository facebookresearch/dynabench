# Copyright (c) Facebook, Inc. and its affiliates.

"""
Set type, has_context and has_answer fields in VQA main task.
"""

from yoyo import step


__depends__ = {"20210224_02_yTRsk-add-aws-metrics-to-scores-table"}

steps = [
    step(
        "UPDATE `tasks` SET type='VQA', has_context=1, has_answer=1 "
        + "WHERE shortname='VQA'"
    )
]
