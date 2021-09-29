# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Update QA F1 threshold to 0.4
"""

from yoyo import step


__depends__ = {"20210924_01_ejxRf-convert-example-metadata-json-to-mediumtext"}

steps = [
    step(
        """UPDATE tasks
        SET annotation_config_json =
        REPLACE(annotation_config_json, '"threshold": 0.9', '"threshold": 0.4')
        WHERE task_code in ('qa', 'dk_qa', 'ucl_qa')""",
        """UPDATE tasks
        SET annotation_config_json =
        REPLACE(annotation_config_json, '"threshold": 0.4', '"threshold": 0.9')
        WHERE task_code in ('qa', 'dk_qa', 'ucl_qa')""",
    )
]
