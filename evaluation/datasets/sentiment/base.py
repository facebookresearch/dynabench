# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from datasets.common import AccessTypeEnum, BaseDataset


class SentimentBase(BaseDataset):
    def __init__(self, name, round_id, access_type=AccessTypeEnum.scoring):
        super().__init__(
            task_code="sentiment", name=name, round_id=round_id, access_type=access_type
        )

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
