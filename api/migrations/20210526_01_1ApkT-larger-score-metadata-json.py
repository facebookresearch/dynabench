# Copyright (c) Facebook, Inc. and its affiliates.

"""
In order to accomodate 100x100 flores performance tags,
we need to increase the size of metadata_json.
"""

from yoyo import step


__depends__ = {
    "20210517_01_JYMLd-hs-round5",
    "20210520_01_tOL8u-add-task-submitable-status",
}

steps = [step("ALTER TABLE scores MODIFY metadata_json LONGTEXT")]
