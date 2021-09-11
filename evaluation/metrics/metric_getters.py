# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import json

from metrics.instance_property import instance_property
from metrics.metrics_dicts import (
    delta_metrics_dict,
    eval_metrics_dict,
    job_metrics_dict,
    metrics_meta_dict,
)


def get_eval_metrics(task, predictions: list, targets: list) -> tuple:
    perf_metric_type = json.loads(task.annotation_config_json)["perf_metric"]["type"]
    eval_metrics = [perf_metric_type]  # NOTE:
    # right now, the returned eval metric scores are just the perf metric, but we
    # could add a feature that allows for the display of multiple eval metrics
    eval_metrics_scores = {
        key: eval_metrics_dict[key](predictions, targets) for key in eval_metrics
    }
    return eval_metrics_scores[perf_metric_type], eval_metrics_scores


def get_job_metrics(job, dataset) -> dict:
    if not job.aws_metrics:
        return {}
    instance_config = instance_property[dataset.task.instance_type]
    job_metrics = instance_config["aws_metrics"]
    return {key: job_metrics_dict[key](job, dataset) for key in job_metrics}


def get_delta_metrics(
    task, predictions: list, targets: list, perturb_prefix: str
) -> dict:
    """
    predictions: a list of list of predictions
    targets: a list of labels
    """
    perf_metric_type = json.loads(task.annotation_config_json)["perf_metric"]["type"]
    perf_metric = eval_metrics_dict[perf_metric_type]
    delta_metrics_scores = {
        perturb_prefix: delta_metrics_dict[perturb_prefix](
            predictions, targets, perf_metric
        )
    }
    return delta_metrics_scores


def get_task_metrics_meta(task):
    instance_config = instance_property[task.instance_type]
    perf_metric_type = json.loads(task.annotation_config_json)["perf_metric"]["type"]
    delta_metric_types = [
        config["type"]
        for config in json.loads(task.annotation_config_json)["delta_metrics"]
    ]
    ordered_metric_field_names = (
        [perf_metric_type] + instance_config["aws_metrics"] + delta_metric_types
    )
    metrics_meta = {
        metric: metrics_meta_dict.get(metric, metrics_meta_dict[perf_metric_type])(task)
        for metric in ordered_metric_field_names
    }
    return metrics_meta, ordered_metric_field_names
