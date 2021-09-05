# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from datasets.common import AccessTypeEnum, BaseDataset


class QaBase(BaseDataset):
    def __init__(self, name, round_id, access_type=AccessTypeEnum.scoring):
        super().__init__(
            task_code="qa", name=name, round_id=round_id, access_type=access_type
        )
