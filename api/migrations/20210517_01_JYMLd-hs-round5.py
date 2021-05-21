# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add hate speech round 5.
"""

import secrets

from yoyo import step


secret = secrets.token_hex()

__depends__ = {"20210511_01_yYAwF-add-model-link"}

steps = [
    step(
        "UPDATE tasks SET cur_round=5 WHERE id=5",
        "UPDATE tasks SET cur_round=4 WHERE id=5",
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES (5,5,'"
        + secret
        + "','https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict"
        + "?model=ts1621286698-DeBERTa',NULL,'The target model is <a target=\"_blank\" "
        + 'href="https://arxiv.org/abs/2006.03654">DeBERTa</a> trained '
        + "on the data from the previous rounds and the anonymized subset of "
        + 'the English hate speech datasets listed on <a target="_blank"href='
        + '"http://hatespeechdata.com/">http://hatespeechdata.com</a> used in '
        + "the previous round.<br><br><b>Task owners</b>: <a href="
        + '"https://www.bertievidgen.net/" target="_blank">Bertie Vidgen</a>; '
        + '<a href="mailto:zeerak.w@gmail.com">Zeerak Waseem</a>.\',0,0,'
        + "NULL,NULL,NULL,0)",
        "DELETE FROM rounds WHERE tid=5 and rid=5",
    ),
    step(
        "INSERT INTO contexts (`r_realid`, `context`) VALUES ("
        + "(SELECT id from rounds where rid=5 and tid=5), "
        + "'Please provide a statement below.')",
        "DELETE FROM contexts WHERE r_realid=(SELECT id from rounds where "
        + "tid=5 and rid=5)",
    ),
]
