# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import sys

from .base import AccessTypeEnum, HsBase


class HatemojiCheck(HsBase):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        self.local_path = os.path.join(
            rootpath, "data", "hs/hatemoji_check/hatemoji_check.csv"
        )
        super().__init__(
            name="hatemoji-check", round_id=0, access_type=AccessTypeEnum.standard
        )

    def label_field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", []),
        }
