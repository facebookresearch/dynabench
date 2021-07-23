# Copyright (c) Facebook, Inc. and its affiliates.

"""Fix the Flores description."""

from yoyo import step


__depends__ = {"20210503_01_xxxx-add-flores-task"}


fix_desc = """Machine Translation Evaluation East Asian languages:
Javanese, Indonesian, Malay, Tagalog, Tamil, English"""

steps = [step(f'UPDATE tasks SET `desc`="{fix_desc}" WHERE task_code="flores_small2"')]
