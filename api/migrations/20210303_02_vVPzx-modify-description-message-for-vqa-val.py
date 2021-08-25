# Copyright (c) Facebook, Inc. and its affiliates.

"""
Modify description message for VQA-VAL.
"""

from yoyo import step


__depends__ = {
    "20210303_01_fAMkR-set-type-has-context-and-has-answer-fields-in-vqa-main-task"
}

steps = [
    step(
        "UPDATE `tasks` SET `desc`='Visual Question "
        + "Answering Validation involves checking that "
        + "questions are good and fooling the model.' WHERE shortname='VQA-VAL'"
    )
]
