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
from models.score import Score, ScoreModel
from models.task import Task, TaskModel
from utils import helpers, computer
from utils.evaluator import Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("request_evaluation")


MODELS = ModelModel()
TASKS = TaskModel()
SCORES = ScoreModel()


def compute_metrics(mid: int, task: Task, blocking: bool = False) -> None:
    """Compute/recompute the metric for the given model"""
    cmp = computer.MetricsComputer(config, load_datasets())
    model_datasets = DatasetModel().getByTid(task.id)
    model = get_model(mid)
    with multiprocessing.pool.Pool(4) as pool:
        for dataset in model_datasets:
            if blocking:
                cmp.compute_one_blocking(Job(mid, dataset.name))
            else:
                cmp.compute_one_async(pool, Job(mid, dataset.name))

        pool.close()
        pool.join()


def inference_and_eval(mid: int, task_code: str, dataset: str) -> None:
    task_config = metrics.get_task_config_safe(task_code)
    helpers.send_eval_request(
        model_id=mid,
        dataset_name=dataset,
        config=config,
        eval_server_id=task_config["eval_server_id"],
        logger=logger,
    )


def get_model(mid: int) -> Model:
    return MODELS.getUnpublishedModelByMid(mid)


def get_task(model: Model) -> Task:
    return TASKS.dbs.query(Task).filter(Task.id == model.tid).one()


def get_shortname(taskname: str) -> str:
    return taskname.upper().replace("_", "-")


def eval(
    mid: int, dataset: str = "*", inference: bool = False, blocking: bool = False
) -> None:
    """Run evaluation for the given model as if has just finished inference.

    --mid: the model id (as seen in the urls)
    --dataset: dataset to run the evaluation on. Defaults to all dataset of the model.
    --inference: if set will also re-run the inference (take longer)
    --blocking: if set will compute the metric in a blocking way
    """
    model = get_model(mid)
    task = get_task(model)
    if inference:
        inference_and_eval(mid, task.task_code, dataset)
    else:
        compute_metrics(mid, task, blocking=blocking)


def list_models(task: str = "", mid: int = 0, scores: bool = False) -> None:
    """List models for the given task or just show details about one model.

    --task: the task shortname
    --mid: alternatively just show this model details
    --scores: if set will also show the score of the selected models
    !!! Those scores may be confidential, some dataset are hidden from participants.
    """
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
        if not scores:
            continue
        try:
            for score in SCORES.dbs.query(Score).filter(Score.mid == model.id):
                print(f"  - dataset {score.did} -> perf: {score.perf}")
        except Exception as e:
            print(e)


if __name__ == "__main__":
    func_argparse.main(eval, list_models)
