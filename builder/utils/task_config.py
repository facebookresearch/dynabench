# Copyright (c) Facebook, Inc. and its affiliates.

_default_config = {
    "instance_type": "ml.m5.xlarge",
    "instance_count": 1,
    "create_endpoint": True,
    "aws_region": "us-west-1",
    "gpu": False,
    "torchserve_config": {},
}

_custom_config = {
    "flores": {
        "instance_type": "ml.p2.xlarge",
        "instance_count": 1,
        "create_endpoint": False,
        "aws_region": "us-west-2",
        "gpu": True,
        # Since we are using batching we need to increase the timeout and request sizes
        "torchserve_config": {
            # This need to be the same value from evaluation/metrics/task_config
            # So that sagemaker and torchserve timeout at the same time
            "default_response_timeout": 1200,
            "decode_input_request": False,
            "max_request_size": 12853500,
            "max_response_size": 12853500,
        },
    }
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
    "nli": _gen_config(),
    "hs": _gen_config(),
    "sentiment": _gen_config(),
    "qa": _gen_config(),
    "flores_full": _gen_config(_custom_config["flores"]),
    "flores_small1": _gen_config(_custom_config["flores"]),
    "flores_small2": _gen_config(_custom_config["flores"]),
}


def get_task_config_safe(task):
    return tasks_config.get(task, tasks_config["default"])
