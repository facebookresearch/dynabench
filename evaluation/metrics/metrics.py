# Copyright (c) Facebook, Inc. and its affiliates.

from transformers.data.metrics.squad_metrics import compute_f1

from metrics.task_config import tasks_config


# perf functions. propose to move to dynalab

# eval_metrics, take predictions and targets as input
def get_accuracy(predictions: list, targets: list):
    return sum([p == t for p, t in zip(predictions, targets)]) / len(targets)


def get_f1(predictions: list, targets: list):
    return sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    return (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * tasks_config[dataset.task]["instance_config"]["memory_gb"]
    )


def get_examples_per_second(job, dataset):
    n_examples = dataset.get_n_examples()
    return (
        n_examples
        / (job.status["TransformEndTime"] - job.status["TransformStartTime"]).seconds
    )
