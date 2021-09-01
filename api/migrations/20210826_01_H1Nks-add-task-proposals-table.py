# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add a new table for task proposals.
"""

from yoyo import step


__depends__ = {
    "20210810_01_iApXr-general_task_creation_consolidation",
    "20210822_01_eZiBk-add-name-to-leaderboard-snapshot",
}

steps = [
    step(
        """ALTER TABLE tasks CHANGE model_wrong_metric
        model_wrong_metric_config_json TEXT""",
        """ALTER TABLE tasks CHANGE model_wrong_metric_config_json
        model_wrong_metric TEXT""",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN active BOOL DEFAULT false",
        "ALTER TABLE tasks DROP active",
    ),
    step(
        """UPDATE tasks SET active=true WHERE task_code in ('dkqa',
        'flores_full', 'flores_small1', 'flores_small2', 'hs', 'ladc', 'nli',
        'placeholder', 'qa', 'sentiment', 'ucl_qa', 'vqa', 'vqa_val', 'yn')"""
    ),
    step("UPDATE tasks SET aggregation_metric='dynascore'"),
    step(
        """
        CREATE TABLE task_proposals (
            id INT NOT NULL AUTO_INCREMENT,
            uid INT NOT NULL,
            task_code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL UNIQUE,
            `desc` TEXT,

            PRIMARY KEY (id),
            CONSTRAINT task_proposals_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
        """,
        "DROP TABLE task_proposals",
    ),
]
