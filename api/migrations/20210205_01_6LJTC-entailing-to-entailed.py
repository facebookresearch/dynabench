# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""

"""

from yoyo import step


__depends__ = {"20210203_02_Q94K5-remove-s3-uri-and-endpoint-url-from-models-table"}

steps = [
    step(
        "UPDATE tasks SET targets='entailed|neutral|contradictory' "
        + "WHERE targets='entailing|neutral|contradictory'",
        "UPDATE tasks SET targets='entailing|neutral|contradictory' "
        + "WHERE targets='entailed|neutral|contradictory'",
    ),
    step(
        "UPDATE validations SET metadata_json=REPLACE(metadata_json, "
        + '\'"validator_label": "entailing"\', \'"validator_label": "entailed"\')',
        "UPDATE validations SET metadata_json=REPLACE(metadata_json, "
        + '\'"validator_label": "entailed"\', \'"validator_label": "entailing"\')',
    ),
]
