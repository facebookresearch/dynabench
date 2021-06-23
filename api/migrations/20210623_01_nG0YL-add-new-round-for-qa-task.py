# Copyright (c) Facebook, Inc. and its affiliates.

"""
Add round 3 for QA task
"""

from yoyo import step


__depends__ = {"20210621_01_IRyiT-rename-qa-f1"}

steps = [
    step(
        """
        INSERT INTO rounds (`tid`, `rid`, `secret`, `url`, `desc`, `longdesc`,
        `total_fooled`, `total_collected`, `total_time_spent`, `start_datetime`,
        `end_datetime`, `total_verified_fooled`) VALUES (2,3,
        \'4a199a7301bad96836a5e5285952761a8fcdd64eab48e7f7db38897d19f49198\',
        \'https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=
        ts1624132576-electra-synqa\',NULL,
        \'Contexts in this round come from
        <a target="_blank" href="https://arxiv.org/abs/2009.02252">KILT</a>
        Wikipedia articles used by at least 5 of the KILT tasks. The target model
        is <a target="_blank" href="https://arxiv.org/abs/2003.10555">
        ELECTRA-Large</a> trained on SQuAD together with the data from
        <a target="_blank" href="https://arxiv.org/abs/2002.00293">Beat the AI</a>
        (Bartolo et al., 2020) and augmented with synthetic adversarial data.
        <br><br><b>Task owners</b>:
        <a href="https://www.maxbartolo.com/" target="_blank">Max Bartolo</a> (UCL);
        <a href="https://pontus.stenetorp.se/" target="_blank">Pontus Stenetorp</a>
        (UCL); <a href="http://www.riedelcastro.org/">Sebastian Riedel</a> (UCL).\',
        0,0,NULL,NULL,NULL,0)
        """,
        "DELETE FROM rounds WHERE tid=2 and rid=3",
    ),
    step(
        "UPDATE tasks SET cur_round=3 WHERE id=2 LIMIT 1",
        "UPDATE tasks SET cur_round=2 WHERE id=2 LIMIT 1",
    ),
]
