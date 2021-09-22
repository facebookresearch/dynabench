# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Rename F1 to SQuAD F1 for clarity.
"""

from yoyo import step


__depends__ = {"20210607_01_n2WJs-hate-speech-r7"}

steps = [
    step(
        """
        UPDATE scores SET metadata_json=REPLACE(metadata_json, "f1", "squad_f1")
        WHERE did IN (SELECT id FROM datasets
        WHERE tid IN (SELECT id FROM tasks WHERE shortname="QA"))
        """,
        """
        UPDATE scores SET metadata_json=REPLACE(metadata_json, "squad_f1", "f1")
        WHERE did IN (SELECT id FROM datasets
        WHERE tid IN (SELECT id FROM tasks WHERE shortname="QA"))
        """,
    )
]
