# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Switch sentiment to three-class
"""

from yoyo import step


__depends__ = {
    "20201102_remove-anon_id-from-examples",
    "20201103_01_skSne-add-model-card",
    "20201116_populate-total-verified-not-fooled-column",
}

steps = [
    step(
        (
            "update tasks set targets='negative|positive|neutral',"
            "has_context=true where id=3"
        ),
        "update tasks set targets='negative|positive',has_context=false where id=3",
    )
]
