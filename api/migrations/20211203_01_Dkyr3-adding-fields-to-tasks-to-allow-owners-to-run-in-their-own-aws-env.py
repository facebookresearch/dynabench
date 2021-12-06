# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
adding fields to tasks to allow owners to run in their own AWS env
"""

from yoyo import step


__depends__ = {"20211028_01_ukEWR-adding-taken-down-non-active-enum"}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN build_sqs_queue TEXT",
        "ALTER TABLE tasks DROP build_sqs_queue",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN eval_sqs_queue TEXT",
        "ALTER TABLE tasks DROP eval_sqs_queue",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN is_decen_task BOOLEAN DEFAULT false",
        "ALTER TABLE tasks DROP is_decen_task",
    ),
]
