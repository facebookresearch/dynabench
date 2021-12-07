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
    # NOTE:
    # right now, the returned eval metric scores are just the perf metric, but we
    # could add a feature that allows for the display of multiple eval metrics
    metric_result = eval_metrics_dict[perf_metric_type](predictions, targets)
    if isinstance(metric_result, dict):
        score_dict = metric_result
    else:
        score_dict = {perf_metric_type: metric_result}
    return score_dict[perf_metric_type], score_dict


def get_job_metrics(job, dataset, decen=False) -> dict:
    if not job.aws_metrics:
        return {}

    if decen:
        instance_config = instance_property[dataset.task_instance_type]
    else:
        instance_config = instance_property[dataset.task.instance_type]
    job_metrics = instance_config["aws_metrics"]
    return {
        key: job_metrics_dict[key](job, dataset, decen=decen) for key in job_metrics
    }


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
    annotation_config = json.loads(task.annotation_config_json)
    perf_metric_type = (
        annotation_config["perf_metric"]["type"]
        if "perf_metric" in annotation_config
        else "accuracy"
    )
    delta_metric_types = (
        []
        if "delta_metrics" not in annotation_config
        else [x["type"] for x in annotation_config["delta_metrics"]]
    )
    aws_metric_names = instance_config["aws_metrics"]

    # TODO: make it possible to display some modes with aws metrics and some
    # models without aws metrics on the same leaderboard?
    if task.has_predictions_upload or "train_file_metric" in annotation_config:
        aws_metric_names = []

    ordered_metric_field_names = (
        [perf_metric_type] + aws_metric_names + delta_metric_types
    )
    metrics_meta = {
        metric: metrics_meta_dict.get(metric, metrics_meta_dict[perf_metric_type])(task)
        for metric in ordered_metric_field_names
    }
    return metrics_meta, ordered_metric_field_names
