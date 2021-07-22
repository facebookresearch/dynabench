# Copyright (c) Facebook, Inc. and its affiliates.

import sys

from datasets.common import AccessTypeEnum, BaseDataset


sys.path.append("../api")


class NliBase(BaseDataset):
    def __init__(
        self,
        name,
        round_id,
        access_type=AccessTypeEnum.scoring,
        longdesc=None,
        source_url=None,
    ):
        super().__init__(
            task="Natural Language Inference",
            name=name,
            round_id=round_id,
            access_type=access_type,
            longdesc=longdesc,
            source_url=source_url,
        )

    def pred_field_converter(self, example):
        return {"id": example["id"], "pred": example["label"]}
