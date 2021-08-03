# Copyright (c) Facebook, Inc. and its affiliates.
# isort:skip-file

import logging
import multiprocessing
import os
import sys

import boto3
import func_argparse
from dynalab_cli.utils import get_tasks

sys.path.append("..")  # noqa
sys.path.append("../../api")

import metrics
from datasets import load_datasets
from eval_config import eval_config as config
from models.dataset import DatasetModel
from models.model import Model, ModelModel
from models.task import Task, TaskModel
from utils import helpers, computer
from utils.evaluator import Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("request_evaluation")


MODELS = ModelModel()
TASKS = TaskModel()


def compute_metrics(model_id: int, task: Task):
    """Compute/recompute the metric for the given model"""
    computer = computer.MetricsComputer(config, load_datasets())
    model_datasets = DatasetModel().getByTid(task.tid)

    with multiprocessing.pool.Pool(4) as pool:
        for dataset in model_datasets:
            computer.compute_one_async(pool, Job(model_id, dataset))

        pool.close()
        pool.join()


def inference_and_eval(model_id: int, task: str, dataset: str):
    task_config = metrics.get_task_config_safe(task)
    helpers.send_eval_request(
        model_id=model_id,
        dataset_name=dataset,
        config=config,
        eval_server_id=task_config["eval_server_id"],
        logger=logger,
    )


def get_model(model_id: int) -> Model:
    return MODELS.getUnpublishedModelByMid(model_id)


def get_task(model: Model) -> Task:
    return TASKS.dbs.query(Task).filter(Task.id == model.tid).one()


def get_shortname(taskname: str) -> str:
    return taskname.upper().replace("_", "-")


def eval(model_id: int, dataset: str, inference: bool = False):
    """Run evaluation for the given model as if it was just submitted."""
    model = get_model(model_id)
    task = get_task(model)
    if inference:
        inference_and_eval(model_id, task.shortname, dataset)
    else:
        compute_metrics(model_id, task.shortname)


def list_models(task: str = "", mid: int = 0):
    """List models for the given task"""
    if mid:
        models = [MODELS.getUnpublishedModelByMid(mid)]
    elif task:
        task_obj = TASKS.getByShortName(get_shortname(task))
        if not task_obj:
            availabe_tasks = [t.shortname for t in TASKS.dbs.query(Task)]
            raise Exception(f"Unknown task {task}. Chose from {availabe_tasks}")
        models = MODELS.getByTid(task_obj.tid)
    else:
        raise Exception("--task or --mid flags are required")

    for model in models:
        print(model.id, model.name, model.deployment_status, model.endpoint_name)


if __name__ == "__main__":
    func_argparse.main(eval, list_models)
