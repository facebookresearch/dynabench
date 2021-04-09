# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import BaseDataset


class HsBase(BaseDataset):
    def __init__(self, name, round_id):
        task = "hs"
        super().__init__(task=task, name=name, round_id=round_id)

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
