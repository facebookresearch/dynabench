# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
