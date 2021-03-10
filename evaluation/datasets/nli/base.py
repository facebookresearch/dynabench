# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.common import BaseDataset


class NliBase(BaseDataset):
    def __init__(self, task, name):
        super().__init__(task=task, name=name)

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
