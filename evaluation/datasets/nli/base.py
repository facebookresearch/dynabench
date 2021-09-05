# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
            task_code="nli",
            name=name,
            round_id=round_id,
            access_type=access_type,
            longdesc=longdesc,
            source_url=source_url,
        )
