"""
Adding task owner AWS account id
"""

from yoyo import step

__depends__ = {'20211026_01_scyfj-support-dataperf', '20211103_01_pdUwN-add-placeholder-validation', '20211203_01_Dkyr3-adding-fields-to-tasks-to-allow-owners-to-run-in-their-own-aws-env'}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN task_aws_account_id TEXT",
        "ALTER TABLE tasks DROP task_aws_account_id",
    ),
]
