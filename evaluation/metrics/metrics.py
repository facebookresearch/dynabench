# Copyright (c) Facebook, Inc. and its affiliates.

from transformers.data.metrics.squad_metrics import compute_f1

from metrics.task_config import get_task_config_safe


# perf functions. propose to move to dynalab

# eval_metrics, take predictions and targets as input
def get_accuracy(predictions: list, targets: list):
    acc = sum([p == t for p, t in zip(predictions, targets)]) / len(targets)
    return round(acc * 100, 2)


def get_accuracy_meta(task=None):
    return {"unit": "%", "pretty_name": "Accuracy", "utility_direction": 1}


def get_f1(predictions: list, targets: list):
    f1 = sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)
    return round(f1 * 100, 2)


def get_f1_meta(task=None):
    return {"unit": "%", "pretty_name": "F1", "utility_direction": 1}


def get_unperturbed_percent(predictions: list, targets: list, metric_func):
    total_unperturbed_weights, total = 0, 0
    for pl, t in zip(predictions, targets):
        if pl:
            total_unperturbed_weights += metric_func(pl, [t] * len(pl))
            total += 1
    return round(total_unperturbed_weights / total, 2)


def get_unperturbed_percent_meta(task=None):
    return {"unit": "%", "pretty_name": "Unperturbed Percent", "utility_direction": 1}


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    mem = (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * get_task_config_safe(dataset.task)["instance_config"]["memory_gb"]
    )
    return round(mem, 2)


def get_memory_utilization_meta(task):
    return {"unit": "GiB", "pretty_name": "Memory_GB", "utility_direction": -1}


def get_examples_per_second(job, dataset):
    n_examples = dataset.get_n_examples()
    eps = (
        n_examples
        / (job.status["TransformEndTime"] - job.status["TransformStartTime"]).seconds
    )
    return round(eps, 2)


def get_examples_per_second_meta(task):
    return {
        "unit": "examples/seconds",
        "pretty_name": "Examples per Second",
        "utility_direction": 1,
    }
