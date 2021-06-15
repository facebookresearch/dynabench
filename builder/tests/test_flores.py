# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from pathlib import Path

from utils import deployer, task_config


DOCKERFILES = Path(__file__).parent.parent / "dockerfiles"
TORCHSERVE_CONFIG = DOCKERFILES / "config.properties"


def test_torchserve_config_is_valid():
    for task_code, config in task_config.tasks_config.items():
        deployer.get_torchserve_config(TORCHSERVE_CONFIG, task_code, config)


def test_flores_config():
    flores_config = task_config.get_task_config_safe("flores_small1")
    expected_torchserve_config = """
# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

inference_address=http://0.0.0.0:8080
management_address=http://0.0.0.0:8081
number_of_netty_threads=32
job_queue_size=1000
model_store=/opt/ml/model
load_models=all


# extra settings from task flores_small1
default_response_timeout=1200
decode_input_request=false
max_request_size=12853500
max_response_size=12853500
"""

    config = deployer.get_torchserve_config(
        TORCHSERVE_CONFIG, "flores_small1", flores_config
    )
    assert config.strip("\n") == expected_torchserve_config.strip("\n")