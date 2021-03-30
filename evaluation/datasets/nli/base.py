# Copyright (c) Facebook, Inc. and its affiliates.

import sys

from datasets.common import BaseDataset
from models.dataset import AccessTypeEnum


sys.path.append("../api")


class NliBase(BaseDataset):
    def __init__(self, task, name, round_id, access_type=AccessTypeEnum.scoring):
        super().__init__(
            task=task, name=name, round_id=round_id, access_type=access_type
        )

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
