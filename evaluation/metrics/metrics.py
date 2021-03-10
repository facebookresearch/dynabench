# Copyright (c) Facebook, Inc. and its affiliates.

from transformers.data.metrics.squad_metrics import compute_f1

from metrics.task_config import tasks_config


# perf functions. propose to move to dynalab

# eval_metrics, take predictions and targets as input
def get_accuracy(predictions: list, targets: list):
    acc = sum([p == t for p, t in zip(predictions, targets)]) / len(targets)
    return round(acc * 100, 2)


def get_f1(predictions: list, targets: list):
    f1 = sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)
    return round(f1 * 100, 2)


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    mem = (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * tasks_config[dataset.task]["instance_config"]["memory_gb"]
    )
    return round(mem, 2)


def get_examples_per_second(job, dataset):
    n_examples = dataset.get_n_examples()
    eps = (
        n_examples
        / (job.status["TransformEndTime"] - job.status["TransformStartTime"]).seconds
    )
    return round(eps, 2)
