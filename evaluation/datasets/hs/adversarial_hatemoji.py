# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import ast
import json
import os
import sys
import tempfile

import pandas as pd
from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class AdversarialHatemojiBase(HsBase):
    def __init__(
        self, name, local_path, round_id=0, access_type=AccessTypeEnum.scoring
    ):
        self.local_path = local_path
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def label_field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", []),
        }


class AhsRound5Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r5_test.csv"
        )
        super().__init__(name="ahs-r5-test", local_path=local_path, round_id=5)


class AhsRound6Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r6_test.csv"
        )
        super().__init__(name="ahs-r6-test", local_path=local_path, round_id=6)


class AhsRound7Test(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r7_test.csv"
        )
        super().__init__(name="ahs-r7-test", local_path=local_path, round_id=7)


class AhsRound5Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r5_dev.csv"
        )
        super().__init__(
            name="ahs-r5-dev",
            local_path=local_path,
            round_id=5,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound6Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r6_dev.csv"
        )
        super().__init__(
            name="ahs-r6-dev",
            local_path=local_path,
            round_id=6,
            access_type=AccessTypeEnum.standard,
        )


class AhsRound7Dev(AdversarialHatemojiBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(
            rootpath, "data", "hs/adversarial_hatemoji/r7_dev.csv"
        )
        super().__init__(
            name="ahs-r7-dev",
            local_path=local_path,
            round_id=7,
            access_type=AccessTypeEnum.standard,
        )
