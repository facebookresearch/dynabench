# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.metric_config import (
    eval_metrics_config,
    job_metrics_config,
    metrics_meta_config,
)
from metrics.task_config import get_task_config_safe


def get_eval_metrics(task: str, predictions: list, targets: list) -> dict:
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
    for metric in task_config["delta_metrics"]:
        metrics_meta[metric]["pretty_name"] = metric.capitalize()
    return metrics_meta
