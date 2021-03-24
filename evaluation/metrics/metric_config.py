# Copyright (c) Facebook, Inc. and its affiliates.

from metrics import metrics


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_config = {"accuracy": metrics.get_accuracy, "f1": metrics.get_f1}

job_metrics_config = {
    "memory_utilization": metrics.get_memory_utilization,
    "seconds_per_example": metrics.get_seconds_per_example,
}

metrics_meta_config = {
    "accuracy": metrics.get_accuracy_meta,
    "f1": metrics.get_f1_meta,
    "memory_utilization": metrics.get_memory_utilization_meta,
    "seconds_per_example": metrics.get_seconds_per_example_meta,
}
