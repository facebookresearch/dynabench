# Copyright (c) Facebook, Inc. and its affiliates.

from utils.helpers import get_accuracy, get_f1


default_config = {"instance_type": "ml.m5.xlarge", "eval_fn": get_accuracy}

task_config = {
    "default": default_config,
    "nli": default_config,
    "hs": default_config,
    "sentiment": default_config,
    "qa": {"instance_type": "ml.m5.xlarge", "eval_fn": get_f1},
}
