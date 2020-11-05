#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.
#

import os
import subprocess
from dataclasses import dataclass, field
from typing import Any, List

import hydra
from mephisto.core.hydra_config import RunScriptConfig, register_script_config
from mephisto.core.operator import Operator
from mephisto.server.blueprints.abstract.static_task.static_blueprint import (
    SharedStaticTaskState,
)
from mephisto.server.blueprints.static_react_task.static_react_blueprint import (
    BLUEPRINT_TYPE,
)
from mephisto.utils.scripts import load_db_and_process_config
from omegaconf import DictConfig

from util import get_qualifications


CURRENT_DIRECTORY = os.path.dirname(os.path.abspath(__file__))


@dataclass
class DynaBenchConfig:
    task_name: str = "no_task"
    task_id: int = 0
    round_id: int = 0


@dataclass
class TestScriptConfig(RunScriptConfig):
    defaults: List[Any] = field(  # noqa
        default_factory=lambda: [
            {"mephisto/blueprint": BLUEPRINT_TYPE},
            {"mephisto/architect": "local"},
            {"mephisto/provider": "mock"},
            "conf/base",
            {"conf": "nli_r1"},
        ]
    )
    dynabench: DynaBenchConfig = DynaBenchConfig()
    num_jobs: int = 3
    preselected_qualifications: List[str] = ("100_hits_approved", "english_only")
    frontend_dir: str = f"{CURRENT_DIRECTORY}/../frontends"


register_script_config(name="scriptconfig", module=TestScriptConfig)


def build_frontend(frontend_dir):
    # automatically build frontend:
    frontend_source_dir = os.path.join(frontend_dir, "web")

    return_dir = os.getcwd()
    os.chdir(frontend_source_dir)
    # we do not remove the old file, subject to change
    # if error occurs during frontend building, user need to manually build frontend
    # if os.path.exists(frontend_build_dir):
    #     shutil.rmtree(frontend_build_dir)
    packages_installed = subprocess.call(["npm", "install"])
    if packages_installed != 0:
        raise Exception(
            "please make sure npm is installed, otherwise view "
            "the above error for more info."
        )

    webpack_complete = subprocess.call(["npm", "run", "mturk"])
    if webpack_complete != 0:
        raise Exception(
            "Webpack appears to have failed to build your "
            "frontend. See the above error for more information."
        )
    os.chdir(return_dir)


@hydra.main(config_name="scriptconfig")
def main(cfg: DictConfig) -> None:
    num_jobs = cfg.num_jobs
    static_task_data = [{} for _ in range(num_jobs)]
    mturk_specific_qualifications = get_qualifications(cfg.preselected_qualifications)
    # mturk_specific_qualifications

    # TODO: How to set onboarding ready?
    def onboarding_always_valid(onboarding_data):
        return True

    shared_state = SharedStaticTaskState(
        static_task_data=static_task_data,
        validate_onboarding=onboarding_always_valid,
        task_config=dict(cfg.dynabench),
    )

    # We need to implicitly add 'mturk_specific_qualifications' here like this.
    shared_state.__setattr__(
        "mturk_specific_qualifications", mturk_specific_qualifications
    )
    # qualifications will be picked up at mturk_provider.py

    build_frontend(cfg.frontend_dir)

    db, cfg = load_db_and_process_config(cfg)
    operator = Operator(db)

    operator.validate_and_run_config(cfg.mephisto, shared_state)
    operator.wait_for_runs_then_shutdown(skip_input=True, log_rate=30)


if __name__ == "__main__":
    main()
