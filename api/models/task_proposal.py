# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db

from .base import Base
from .task import AggregationMetricEnum


class TaskProposal(Base):
    __tablename__ = "task_proposals"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    uid = db.Column(db.Integer, db.ForeignKey("users.id"))

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), unique=True, nullable=False)
    annotation_config_json = db.Column(db.Text, nullable=False)
    aggregation_metric = db.Column(
        db.Enum(AggregationMetricEnum),
        default=AggregationMetricEnum.dynascore,
        nullable=False,
    )
    model_wrong_metric = db.Column(db.Text, nullable=False)
    instructions_md = db.Column(db.Text, nullable=False)

    desc = db.Column(db.String(length=255))

    hidden = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    settings_json = db.Column(db.Text)

    instance_type = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    eval_metrics = db.Column(db.Text, default="macro_f1", nullable=False)
    perf_metric = db.Column(db.Text, default="macro_f1", nullable=False)
    delta_metrics = db.Column(db.Text, default="fairness|robustness", nullable=True)
    create_endpoint = db.Column(db.Boolean, default=True)
    gpu = db.Column(db.Boolean, default=False)
    extra_torchserve_config = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d
