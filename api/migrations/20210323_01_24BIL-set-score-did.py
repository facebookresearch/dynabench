# Copyright (c) Facebook, Inc. and its affiliates.

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
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="anli-r3-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="aqa-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="dynasent-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="dynasent-r2-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r1-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r2-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
    step(
        """
        UPDATE scores SET did=(SELECT id FROM datasets WHERE name="hs-r3-test")
        where r_realid=(SELECT id FROM rounds WHERE rid=1 and tid=1)
        """
    ),
]
