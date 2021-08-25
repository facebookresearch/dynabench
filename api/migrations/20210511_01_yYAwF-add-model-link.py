# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add URL field to models table.
"""

from yoyo import step


__depends__ = {"20210505_01_frwye-populate-dataset-desc-and-link"}

steps = [
    step("ALTER TABLE models ADD source_url Text", "ALTER TABLE models DROP source_url")
]
