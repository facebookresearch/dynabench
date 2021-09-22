# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
