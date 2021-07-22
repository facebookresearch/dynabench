# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add FLORES unpublished dynaboard setting
"""

from yoyo import step


__depends__ = {"20210710_01_TTcLy-fix-qa-r3-model-url"}

steps = [
    step(
        """
            UPDATE tasks set settings_json=
            '{"include_unpublished_models_in_dynaboard": true}'
            where name in ('Flores MT Evaluation (Small task 1)',
            'Flores MT Evaluation (Small task 2)',
            'Flores MT Evaluation (FULL)')
        """
    )
]
