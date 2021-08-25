# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add description and link for flores datasets and fix access_type.
"""

from yoyo import step


__depends__ = {"20210521_01_xxxx-open_flores", "20210531_01_uJdeR-hate-speech-round-6"}

steps = [
    step(
        """
        UPDATE datasets SET longdesc="FLoRes is a benchmark dataset for machine
        translation between English and low-resource languages.",
        """
        + 'source_url="https://ai.facebook.com/research/publications/the-flores-101'
        + "-evaluation-benchmark-for-low-resource-and-multilingual-machine-trans"
        + 'lation" WHERE name IN '
        + """
        ("flores101-full-dev", "flores101-full-devtest", "flores101-full-test",
        "flores101-small1-dev", "flores101-small1-devtest", "flores101-small1-test",
        "flores101-small2-dev", "flores101-small2-devtest", "flores101-full-test")
        """
    ),
    step(
        """
        UPDATE datasets SET access_type="standard" WHERE name IN
        ("flores101-full-dev", "flores101-small1-dev", "flores101-small2-dev")
        """
    ),
    step(
        """
        UPDATE datasets SET access_type="hidden" WHERE name IN
        ("flores101-full-test", "flores101-small1-test", "flores101-small2-test")
        """
    ),
]
