# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.instance_property import instance_property
from metrics.metrics_config import (
    delta_metrics_config,
    eval_metrics_config,
    job_metrics_config,
    metrics_meta_config,
)


def get_eval_metrics(task, predictions: list, targets: list) -> tuple:
    eval_metrics = task.eval_metrics.split("|")
    eval_metrics_dict = {
        key: eval_metrics_config[key](predictions, targets) for key in eval_metrics
    }
    return eval_metrics_dict[task.perf_metric], eval_metrics_dict


def get_job_metrics(job, dataset) -> dict:
    if not job.aws_metrics:
        return {}
    instance_config = instance_property[dataset.task.instance_type]
    job_metrics = instance_config["aws_metrics"]
    return {key: job_metrics_config[key](job, dataset) for key in job_metrics}


def get_delta_metrics(
    task, predictions: list, targets: list, perturb_prefix: str
) -> dict:
    """
    predictions: a list of list of predictions
    targets: a list of labels
    """
    perf_metric = eval_metrics_config[task.perf_metric]
    delta_metrics_dict = {
        perturb_prefix: delta_metrics_config[perturb_prefix](
            predictions, targets, perf_metric
        )
    }
    return delta_metrics_dict


def get_task_metrics_meta(task):
    instance_config = instance_property[task.instance_type]
    perf_metric = task.perf_metric
    delta_metrics = []
    if task.delta_metrics is not None:
        delta_metrics = task.delta_metrics.split("|")
    ordered_metric_field_names = (
        [perf_metric] + instance_config["aws_metrics"] + delta_metrics
    )
    metrics_meta = {
        metric: metrics_meta_config.get(metric, metrics_meta_config[perf_metric])(task)
        for metric in ordered_metric_field_names
    }
    return metrics_meta, ordered_metric_field_names
