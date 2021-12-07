# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
adding task owner ability to specify heroku domain
"""

from yoyo import step


__depends__ = {
    "20211026_01_scyfj-support-dataperf",
    "20211103_01_pdUwN-add-placeholder-validation",
}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN data_collection_heroku_url TEXT",
        "ALTER TABLE tasks DROP data_collection_heroku_url",
    )
]
