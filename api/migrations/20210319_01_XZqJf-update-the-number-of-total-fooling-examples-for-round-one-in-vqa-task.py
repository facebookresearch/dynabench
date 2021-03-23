# Copyright (c) Facebook, Inc. and its affiliates.

"""
Update the number of total fooling examples for round one in VQA task.
"""

from yoyo import step


__depends__ = {"20210316_01_Fp9q1-add-fairness-and-robustness-column-in-scores-table"}

steps = [
    step(
        "UPDATE rounds, tasks SET rounds.total_fooled = (SELECT COUNT(*) "
        + "FROM (SELECT examples.id FROM examples INNER JOIN contexts ON "
        + "examples.cid = contexts.id INNER JOIN rounds ON contexts.r_realid "
        + "= rounds.id INNER JOIN tasks ON rounds.tid = tasks.id WHERE "
        + "rounds.rid = 1 AND tasks.shortname = 'VQA' AND examples.model_wrong = 1) "
        + "AS fooled_examples) WHERE rounds.tid = tasks.id AND rounds.rid = 1 "
        + "AND tasks.shortname = 'VQA';"
    )
]
