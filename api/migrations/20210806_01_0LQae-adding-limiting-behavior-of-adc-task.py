"""
Adding limiting behavior of ADC task
"""

import secrets

from yoyo import step


secret = secrets.token_hex()

_depends_ = {
    "20210723_01_PTI5B-add-leaderboard-snapshots-table",
    "20210730_01_02Na6-change-example-metadata-json-type-to-mediumtext",
}

steps = [
    step(
        "INSERT INTO `tasks` (name, shortname, `desc`, `longdesc`, targets "
        + ", score_progression, total_verified, total_collected, last_updated, cur_round "
        + ", has_context, has_answer, hidden, type, owner_str, settings_json, task_code, submitable) "
        + "VALUES ('Limiting ADC','LADC', 'NLI', "
        + "'Natural Language Inference is classifying"
        + " context-hypothesis pairs into whether they entail, contradict or are neutral.','entailed|neutral|contradictory',"
        + "NULL,0,0,NOW(), 1, 1, 0, 1, 'clf', NULL,NULL,'ladc',0)",
        "DELETE FROM `tasks` WHERE shortname='LADC'",
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES ((SELECT id FROM tasks WHERE task_code='ladc'),1,'"
        + secret
        + "','https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=ts1627929013-feversnlimnli100000'"
        + ",NULL,NULL,0,0, NULL, NULL, NULL, 0)",
        "DELETE FROM `rounds` WHERE tid=(SELECT id FROM tasks WHERE task_code='ladc')",
    ),
]
