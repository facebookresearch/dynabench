# Copyright (c) Facebook, Inc. and its affiliates.

from metrics import metrics


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_config = {"accuracy": metrics.get_accuracy, "f1": metrics.get_f1}

job_metrics_config = {
    "memory_utilization": metrics.get_memory_utilization,
    "examples_per_second": metrics.get_examples_per_second,
}
