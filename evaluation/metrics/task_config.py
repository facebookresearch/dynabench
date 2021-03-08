# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.instance_property import instance_property


# TODO: long term, move task I/O keys here too
default_config = {
    "instance_config": instance_property["ml.m5.xlarge"],
    "instance_count": 1,
    "eval_metrics": ["accuracy"],
    "perf_metric": "accuracy",
}

tasks_config = {
    "default": default_config,
    "nli": default_config,
    "hs": default_config,
    "sentiment": default_config,
    "qa": {
        "instance_config": instance_property["ml.m5.xlarge"],
        "instance_count": 1,
        "eval_metrics": ["f1"],
        "perf_metric": "f1",
    },
}
