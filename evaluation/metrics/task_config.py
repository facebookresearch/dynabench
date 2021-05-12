# Copyright (c) Facebook, Inc. and its affiliates.

from metrics.instance_property import instance_property


# TODO: long term, move task I/O keys here too
_default_config = {
    "instance_config": instance_property["ml.m5.2xlarge"],
    "instance_count": 1,
    "eval_metrics": ["accuracy"],
    "perf_metric": "accuracy",
    "delta_metrics": ["fairness", "robustness"],
    "input_keys": ["uid", "statement"],
}

_custom_config = {
    "nli": {"input_keys": ["uid", "context", "hypothesis"]},
    "qa": {
        "input_keys": ["uid", "context", "question"],
        "eval_metrics": ["f1"],
        "perf_metric": "f1",
    },
    "flores": {
        "instance_config": instance_property["ml.m5.xlarge"],
        "eval_metrics": ["bleu"],
        "perf_metric": "bleu",
        # Disable input key filtering because
        # Sagemaker can't filter on snake cased names:
        # "input_keys": ["uid", "source_text", "source_language", "target_language"],
        # TODO: edit the keys in the dataset
        "input_keys": "",
    },
}


def _gen_config(config=None):
    if not config:
        return _default_config

    new_config = _default_config.copy()
    for key in config:
        new_config[key] = config[key]
    return new_config


tasks_config = {
    "default": _gen_config(),
    "nli": _gen_config(_custom_config["nli"]),
    "hs": _gen_config(),
    "sentiment": _gen_config(),
    "qa": _gen_config(_custom_config["qa"]),
    "flores_full": _gen_config(_custom_config["flores"]),
    "flores_small1": _gen_config(_custom_config["flores"]),
    "flores_small2": _gen_config(_custom_config["flores"]),
}


def get_task_config_safe(task):
    return tasks_config.get(task, tasks_config["default"])
