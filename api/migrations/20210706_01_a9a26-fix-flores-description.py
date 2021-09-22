# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Fix the Flores description."""

from yoyo import step


__depends__ = {"20210503_01_xxxx-add-flores-task"}


fix_desc = """Machine Translation Evaluation East Asian languages:
Javanese, Indonesian, Malay, Tagalog, Tamil, English"""

steps = [step(f'UPDATE tasks SET `desc`="{fix_desc}" WHERE task_code="flores_small2"')]
