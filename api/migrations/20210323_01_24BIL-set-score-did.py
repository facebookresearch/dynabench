# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Make old scores' did non-null
"""

from yoyo import step


__depends__ = {
    "20210308_01_d8XN5-rename-scores-rid",
    "20210316_01_Fp9q1-add-fairness-and-robustness-column-in-scores-table",
}

steps = [
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="anli-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="anli-r2-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=2 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="anli-r3-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=3 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="aqa-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=2)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="dynasent-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=3)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="dynasent-r2-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=2 and tid=3)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=5)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r2-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=2 and tid=5)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r3-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=3 and tid=5)
        """
    ),
]
