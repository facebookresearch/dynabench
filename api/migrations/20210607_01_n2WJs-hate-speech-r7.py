# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add hate speech round 7.
"""

import secrets

from yoyo import step


secret = secrets.token_hex()

__depends__ = {
    "20210603_01_RuGGv-add-description-and-link-for-flores-datasets-and-fix-access-type"
}

steps = [
    step(
        "UPDATE tasks SET cur_round=7 WHERE id=5",
        "UPDATE tasks SET cur_round=6 WHERE id=5",
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES (5,7,'"
        + secret
        + "','https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict"
        + "?model=ts1623006414-deberta7',NULL,'The target model is "
        + '<a target="_blank" '
        + 'href="https://arxiv.org/abs/2006.03654">DeBERTa</a> trained '
        + "on the data from the previous rounds and the anonymized subset of "
        + 'the English hate speech datasets listed on <a target="_blank"href='
        + '"http://hatespeechdata.com/">http://hatespeechdata.com</a> used in '
        + "the previous round.<br><br><b>Task owners</b>: <a href="
        + '"https://www.bertievidgen.net/" target="_blank">Bertie Vidgen</a>; '
        + '<a href="mailto:zeerak.w@gmail.com">Zeerak Waseem</a>.\',0,0,'
        + "NULL,NULL,NULL,0)",
        "DELETE FROM rounds WHERE tid=5 and rid=7",
    ),
    step(
        "INSERT INTO contexts (`r_realid`, `context`) VALUES ("
        + "(SELECT id from rounds where rid=7 and tid=5), "
        + "'Please provide a statement below.')",
        "DELETE FROM contexts WHERE r_realid=(SELECT id from rounds where "
        + "tid=5 and rid=7)",
    ),
]
