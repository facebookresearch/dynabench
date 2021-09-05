# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import sys
import tempfile

import pandas as pd
from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class AhsBase(HsBase):
    def __init__(self, name, split, round_id=0, access_type=AccessTypeEnum.scoring):
        self.split = split
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(rootpath, "data", "hs/ahs/final_ahs_dataset.csv")
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def label_field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", []),
        }


class AhsRound1Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r1-test", split="test", round_id=1)


class AhsRound2Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r2-test", split="test", round_id=2)


class AhsRound3Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r3-test", split="test", round_id=3)


class AhsRound4Test(AhsBase):
    def __init__(self):
        super().__init__(name="ahs-r4-test", split="test", round_id=4)


class AhsRound1Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r1-dev",
            split="dev",
            round_id=1,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound2Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r2-dev",
            split="dev",
            round_id=2,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound3Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r3-dev",
            split="dev",
            round_id=3,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound4Dev(AhsBase):
    def __init__(self):
        super().__init__(
            name="ahs-r4-dev",
            split="dev",
            round_id=4,
            access_type=AccessTypeEnum.standard,
        )
