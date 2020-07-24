import os
import time
import shlex
import json
import sys
sys.path.append('./Mephisto')
from mephisto.core.local_database import LocalMephistoDB
from mephisto.core.operator import Operator
from mephisto.utils.scripts import MephistoRunScriptParser

from util import arg_handler, get_qualifications

parser = MephistoRunScriptParser()
architect_type, requester_name, db, args = arg_handler(parser)
task_config = json.load(open(args['task']))

extra_args = {
    'static_task_data': [{} for _ in range(args['num_jobs'])],
    'task_config': task_config,
# TODO: Fix this once Mephisto fixes it:
#    'mturk_specific_qualifications': get_qualifications(task_config['qualifications'])
}

ARG_STRING = (
    "--blueprint-type static_react_task "
    f"--architect-type {architect_type} "
    f"--requester-name {requester_name} "
    f'--task-title "\\"{task_config["task_title"]}\\"" '
    f'--task-description "\\"{task_config["task_description"]}\\"" '
    f"--task-reward {task_config['reward_in_dollars']} "
    f"--task-tags {task_config['tags']} "
    f'--task-source "../frontends/web/build/bundle.js" '
    f"--units-per-assignment 1 "
    f"--task-name {task_config['task_name']} "
    f"--port {args['port']} "
)

if args['use_onboarding']:
    ARG_STRING += f"--onboarding-qualification {task_config['onboarding_qualification_name']}"

operator = Operator(db)
operator.parse_and_launch_run_wrapper(shlex.split(ARG_STRING), extra_args=extra_args)
operator.wait_for_runs_then_shutdown()
