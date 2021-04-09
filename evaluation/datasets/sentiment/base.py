# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import BaseDataset
from models.dataset import AccessTypeEnum


class SentimentBase(BaseDataset):
    def __init__(self, name, round_id, access_type=AccessTypeEnum.scoring):
        super().__init__(
            task="sentiment", name=name, round_id=round_id, access_type=access_type
        )

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
