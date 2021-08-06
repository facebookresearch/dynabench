"""
Adding limiting behavior of ADC task
"""

import secrets

from yoyo import step

__depends__ = {'20210723_01_PTI5B-add-leaderboard-snapshots-table', '20210730_01_02Na6-change-example-metadata-json-type-to-mediumtext'}

secret = secrets.token_hex()

steps = [
    step(
        "INSERT INTO `tasks` (id, name, shortname, `desc`, `longdesc`, targets "
        + ", score_progression, total_verified, total_collected, last_updated, cur_round "
        + ", has_context, has_answer, hidden, type, owner_str, settings_json, task_code, submitable) "
        + "VALUES (17,'Limiting ADC','LADC', 'NLI', "
        + "'Natural Language Inference is classifying"
        + " context-hypothesis pairs into whether they entail, contradict or are neutral.',NULL,"
        + "NULL,0,0,NOW(), 1, 1, 0, 1, 'clf', NULL,NULL,'ladc',0)",
        "DELETE FROM `tasks` WHERE shortname='LADC'",
    ),
    step(
        "INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,"
        + "`total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,"
        + "`end_datetime`, `total_verified_fooled`) VALUES (17,1,'"
        + secret
        + "','https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=ts1627929013-feversnlimnli100000'"
        + ",NULL,NULL,0,0, NULL, NULL, NULL, 0)",
        "DELETE FROM `rounds` WHERE tid=17",
    ),
]
