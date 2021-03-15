# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import BaseDataset


class NliBase(BaseDataset):
    def __init__(self, task, name, round_id):
        super().__init__(task=task, name=name, round_id=round_id)

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
