# Copyright (c) Facebook, Inc. and its affiliates.

from transformers.data.metrics.squad_metrics import compute_f1

from metrics.task_config import get_task_config_safe


# perf functions. propose to move to dynalab

# eval_metrics, take predictions and targets as input
def get_accuracy(predictions: list, targets: list):
    acc = sum([p == t for p, t in zip(predictions, targets)]) / len(targets)
    return round(acc * 100, 2)


def get_accuracy_meta(task=None):
    return {"unit": "%", "range": (0, 100), "pretty_name": "Accuracy"}


def get_f1(predictions: list, targets: list):
    f1 = sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)
    return round(f1 * 100, 2)


def get_f1_meta(task=None):
    return {"unit": "%", "range": (0, 100), "pretty_name": "F1"}


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    mem = (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * get_task_config_safe(dataset.task)["instance_config"]["memory_gb"]
    )
    return round(mem, 2)


def get_memory_utilization_meta(task):
    return {
        "unit": "GiB",
        "range": (0, get_task_config_safe(task)["instance_config"]["memory_gb"]),
        "pretty_name": "Memory_GB",
    }


def get_examples_per_second(job, dataset):
    n_examples = dataset.get_n_examples()
    eps = (
        n_examples
        / (job.status["TransformEndTime"] - job.status["TransformStartTime"]).seconds
    )
    return round(eps, 2)


def get_sec_per_example_meta(task=None):
    return {
        "unit": "sec per example",
        "range": (0, 10),
        "pretty_name": "Seconds per Example",
    }
