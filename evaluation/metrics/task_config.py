# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.instance_property import instance_property


# TODO: long term, move task I/O keys here too
_default_config = {
    "instance_config": instance_property["ml.m5.xlarge"],
    "instance_count": 1,
    "eval_metrics": ["accuracy"],
    "perf_metric": "accuracy",
    "delta_metrics": ["fairness", "robustness"],
    "input_keys": ["uid", "context"],
}

_custom_config = {
    "nli": {"input_keys": ["uid", "context", "hypothesis"]},
    "qa": {
        "input_keys": ["uid", "context", "question"],
        "eval_metrics": ["f1"],
        "perf_metric": "f1",
    },
}


def _get_config(config=None):
    if not config:
        return _default_config

    new_config = _default_config.copy()
    for key in config:
        new_config[key] = config[key]
    return new_config


tasks_config = {
    "default": _get_config(),
    "nli": _get_config(_custom_config["nli"]),
    "hs": _get_config(),
    "sentiment": _get_config(),
    "qa": _get_config(_custom_config["qa"]),
}
