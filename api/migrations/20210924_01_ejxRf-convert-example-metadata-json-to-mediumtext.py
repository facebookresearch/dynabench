# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Convert example metadata_json to MEDIUMTEXT
"""

from yoyo import step


__depends__ = {"20210921_02_MUhGK-add-threshold-to-qa-perf-metric-config"}

steps = [
    step(
        "ALTER TABLE examples MODIFY metadata_json MEDIUMTEXT",
        "ALTER TABLE examples MODIFY metadata_json TEXT",
    )
]
