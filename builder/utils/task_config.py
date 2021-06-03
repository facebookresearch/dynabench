# Copyright (c) Facebook, Inc. and its affiliates.

_default_config = {
    "instance_type": "ml.m5.xlarge",
    "instance_count": 1,
    "create_endpoint": True,
}

_custom_config = {}


def _gen_config(config=None):
    if not config:
        return _default_config

    new_config = _default_config.copy()
    for key in config:
        new_config[key] = config[key]
    return new_config


tasks_config = {
    "default": _gen_config(),
    "nli": _gen_config(),
    "hs": _gen_config(),
    "sentiment": _gen_config(),
    "qa": _gen_config(),
}


def get_task_config_safe(task):
    return tasks_config.get(task, tasks_config["default"])
