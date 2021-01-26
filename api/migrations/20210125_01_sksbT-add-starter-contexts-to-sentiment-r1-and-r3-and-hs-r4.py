# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add starter contexts to sentiment r1 and r3, and hs r4.
"""

from yoyo import step


__depends__ = {"20210119_01_ATDVS-add-sentiment-r3-and-rearrange"}

steps = [
    step(
        "INSERT INTO contexts (`r_realid`, `context`) VALUES"
        + " ((SELECT id FROM rounds WHERE tid=3 and rid=1),"
        + ' "Please pretend you are reviewing a restaurant, movie, or book."),'
        + " ((SELECT id FROM rounds WHERE tid=3 and rid=3),"
        + ' "Please pretend you are reviewing a restaurant, movie, or book."),'
        + " ((SELECT id FROM rounds WHERE tid=5 and rid=4),"
        + ' "Please provide a statement below.")',
        "DELETE FROM contexts WHERE r_realid IN"
        + " ((SELECT id FROM rounds WHERE tid=3 and rid=1),"
        + " (SELECT id FROM rounds WHERE tid=3 and rid=3),"
        + " (SELECT id FROM rounds WHERE tid=5 and rid=4))",
    )
]
