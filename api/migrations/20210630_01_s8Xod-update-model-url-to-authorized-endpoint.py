# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
update-model-url-to-authorized-endpoint
"""

from yoyo import step


__depends__ = {"20210621_01_IRyiT-rename-qa-f1"}

steps = [
    step(
        "UPDATE rounds SET url = REPLACE(url, 'fhcxpbltv0', 'obws766r82')",
        "UPDATE rounds SET url = REPLACE(url, 'obws766r82', 'fhcxpbltv0')",
    )
]
