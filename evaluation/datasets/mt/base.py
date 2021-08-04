# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import BaseDataset


class MTBase(BaseDataset):
    def __init__(self, task_code, name, round_id):
        super().__init__(task_code=task_code, name=name, round_id=round_id)

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["translatedText"]}
