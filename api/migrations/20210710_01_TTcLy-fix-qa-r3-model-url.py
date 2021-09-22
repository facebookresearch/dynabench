# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Fix QA R3 Model URL
"""

from yoyo import step


__depends__ = {"20210701_01_yaeLK-add-leaderboard-configurations-table"}

steps = [
    step(
        """UPDATE rounds SET url="https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=ts1624132576-electra-synqa" WHERE tid=2 AND rid=3 LIMIT 1""",  # noqa
        """UPDATE rounds SET url="https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=ts1624132576-electra-synqa" WHERE tid=2 AND rid=3 LIMIT 1""",  # noqa
    )
]
