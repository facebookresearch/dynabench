# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import AccessTypeEnum, BaseDataset


class HsBase(BaseDataset):
    def __init__(self, name, round_id, access_type=AccessTypeEnum.scoring):
        super().__init__(
            task="Hate Speech", name=name, round_id=round_id, access_type=access_type
        )

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
