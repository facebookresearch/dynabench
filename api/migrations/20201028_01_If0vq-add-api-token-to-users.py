# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add api_token to users
"""

from yoyo import step


__depends__ = {}

steps = [
    step(
        "ALTER TABLE users ADD COLUMN api_token VARCHAR(255)",
        "ALTER TABLE users DROP COLUMN api_token",
    )
]
