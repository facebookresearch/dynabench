# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.metric_config import (
    eval_metrics_config,
    job_metrics_config,
    metrics_meta_config,
)
from metrics.task_config import get_task_config_safe


def get_eval_metrics(task: str, predictions: list, targets: list) -> tuple:
    task_config = get_task_config_safe(task)
    eval_metrics = task_config["eval_metrics"]
    eval_metrics_dict = {
        key: eval_metrics_config[key](predictions, targets) for key in eval_metrics
    }
    return eval_metrics_dict[task_config["perf_metric"]], eval_metrics_dict


def get_job_metrics(job, dataset) -> dict:
    task_config = get_task_config_safe(dataset.task)
    job_metrics = task_config["instance_config"]["aws_metrics"]
    return {key: job_metrics_config[key](job, dataset) for key in job_metrics}


def get_delta_metrics(
    task: str, predictions: list, targets: list, perturb_prefix: str
) -> dict:
    """
    predictions: a list of list of predictions
    targets: a list of labels
    """
    task_config = get_task_config_safe(task)
    delta_metrics = task_config["delta_metrics"]
    delta_metrics_dict = {
        perturb_prefix: delta_metrics[perturb_prefix](predictions, targets)
    }
    return delta_metrics_dict


def get_task_metrics_meta(task):
    task_config = get_task_config_safe(task)
    instance_config = task_config["instance_config"]
    perf_metric = task_config["perf_metric"]
    metrics = (
        [perf_metric] + task_config["delta_metrics"] + instance_config["aws_metrics"]
    )
    metrics_meta = {
        metric: metrics_meta_config.get(metric, metrics_meta_config[perf_metric])(task)
        for metric in metrics
    }
    return metrics_meta
