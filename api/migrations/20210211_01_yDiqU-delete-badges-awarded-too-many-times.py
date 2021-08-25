# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Delete badges that were awarded too many times by a buggy cronjob and won't be
removed by the fixed cronjob.
"""

from yoyo import step


__depends__ = {
    "20210127_01_sHlix-add-round-user-example-info-table",
    "20210205_01_6LJTC-entailing-to-entailed",
}

steps = [
    step(
        "DELETE FROM badges WHERE name='FIRST_VALIDATED_FOOLING' or name='FIRST_STEPS'"
    )
]
