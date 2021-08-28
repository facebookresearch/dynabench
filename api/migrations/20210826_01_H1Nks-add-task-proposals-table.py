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
        """
        CREATE TABLE task_proposals (
            id INT NOT NULL AUTO_INCREMENT,
            uid INT NOT NULL,
            task_code VARCHAR(255) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL UNIQUE,
            annotation_config_json MEDIUMTEXT NOT NULL,
            aggregation_metric ENUM('dynascore') NOT NULL,
            model_wrong_metric TEXT NOT NULL,
            instructions_md MEDIUMTEXT NOT NULL,
            `desc` TEXT,
            hidden BOOL DEFAULT false,
            submitable BOOL DEFAULT false,
            settings_json TEXT,
            instance_type TEXT,
            instance_count INT(11),
            eval_metrics TEXT,
            perf_metric TEXT,
            delta_metrics TEXT,
            create_endpoint BOOL DEFAULT false,
            gpu BOOL DEFAULT false,
            extra_torchserve_config TEXT,

            PRIMARY KEY (id),
            CONSTRAINT task_proposals_uid FOREIGN KEY (uid) REFERENCES users (id)
        )
        """,
        "DROP TABLE task_proposals",
    )
]
