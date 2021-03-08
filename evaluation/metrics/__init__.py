# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.metric_config import eval_metrics_config, job_metrics_config
from metrics.task_config import tasks_config


def get_eval_metrics(task: str, predictions: list, targets: list) -> dict:
    task_config = tasks_config.get(task, tasks_config["default"])
    eval_metrics = task_config["eval_metrics"]
    eval_metrics_dict = {
        key: eval_metrics_config[key](predictions, targets) for key in eval_metrics
    }
    return eval_metrics_dict[task_config["perf_metric"]], eval_metrics_dict


def get_job_metrics(job, dataset) -> dict:
    task = dataset.task
    task_config = tasks_config.get(task, tasks_config["default"])
    job_metrics = task_config["instance_config"]["aws_metrics"]
    return {key: job_metrics_config[key](job, dataset) for key in job_metrics}
