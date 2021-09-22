# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add metadata_json to users
"""

from yoyo import step


__depends__ = {}

steps = [
    step(
        "ALTER TABLE users ADD COLUMN metadata_json TEXT",
        "ALTER TABLE users DROP COLUMN metadata_json",
    )
]
