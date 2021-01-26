# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add starter contexts to sentiment r1 and r3, and hs r4.
"""

from yoyo import step


__depends__ = {"20210119_01_ATDVS-add-sentiment-r3-and-rearrange"}

steps = [
    step(
        "INSERT INTO contexts (`r_realid`, `context`) VALUES"
        + ' (17, ""), (18, ""), (19, "")',
        "DELETE FROM contexts WHERE r_realid IN (17, 18, 19)",
    )
]
