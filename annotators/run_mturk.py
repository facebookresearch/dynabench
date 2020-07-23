import os
import time
import shlex
import json
import sys
sys.path.append('./Mephisto')
from mephisto.core.local_database import LocalMephistoDB
from mephisto.core.operator import Operator
from mephisto.utils.scripts import MephistoRunScriptParser, str2bool

parser = MephistoRunScriptParser()
parser.add_argument(
    "-uo",
    "--use-onboarding",
    default=False,
    help="Launch task with onboarding requirement",
    type=str2bool,
)
parser.add_argument(
    "-t",
    "--task",
    required=True,
    help="Task configuration file",
    type=str
)
parser.add_argument(
    "-n",
    "--num-jobs",
    required=True,
    help="Number of jobs",
    type=int
)
parser.add_argument(
    "--port",
    default=3001,
    help="Port to launch interface on",
    type=int
)
architect_type, requester_name, db, args = parser.parse_launch_arguments()
task_config = json.load(open(args['task']))
extra_args = {
    'static_task_data': [{} for _ in range(args['num_jobs'])],
    'task_config': task_config
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
    f"--port {args['port']}"
)

operator = Operator(db)
operator.parse_and_launch_run_wrapper(shlex.split(ARG_STRING), extra_args=extra_args)
operator.wait_for_runs_then_shutdown()
