# Copyright (c) Facebook, Inc. and its affiliates.
# isort:skip-file

import logging
import multiprocessing
import os
import sys
from pathlib import Path

import boto3
import func_argparse
from dynalab_cli.utils import get_tasks

sys.path.append("..")  # noqa
sys.path.append("../../api")

from datasets import load_datasets
from eval_config import eval_config as config
from models.dataset import DatasetModel
from models.model import DeploymentStatusEnum, Model, ModelModel
from models.score import Score, ScoreModel
from models.task import Task, TaskModel
from utils import helpers, computer
from utils.evaluator import Job

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("request_evaluation")


MODELS = ModelModel()
TASKS = TaskModel()
SCORES = ScoreModel()


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
        inference_and_eval(mid, task, dataset)
    else:
        compute_metrics(mid, task, blocking=blocking)


def inference_and_eval(mid: int, task: Task, dataset: str) -> None:
    helpers.send_eval_request(
        model_id=mid,
        dataset_name=dataset,
        config=config,
        eval_server_id=task.eval_server_id,
        logger=logger,
    )


def build(mid: int) -> None:
    model = get_model(mid)
    task = get_task(model)

    logger.info(
        f"Changing status of model {model.endpoint_name} ({mid})"
        f" from {model.deployment_status} to UPLOADED"
    )
    model.deployment_status = DeploymentStatusEnum.uploaded
    # The request is the same for takedown/build, the action taken
    # depends on the current deployement status of the model
    s3_uri = f"s3://{task.s3_bucket}/torchserve/models/{task.task_code}/{model.endpoint_name}.tar.gz"
    # hack the config dict to add the missing build queue name
    config["builder_sqs_queue"] = "dynabench-build"
    helpers.send_takedown_model_request(mid, config, s3_uri)


def takedown(mid: int) -> None:
    model = get_model(mid)
    config["builder_sqs_queue"] = "dynabench-build"
    helpers.send_takedown_model_request(
        model_id=mid,
        config=config,
    )


def compute_metrics(mid: int, task: Task, blocking: bool = False) -> None:
    """Compute/recompute the metric for the given model"""
    cmp = computer.MetricsComputer(config, load_datasets())
    model_datasets = DatasetModel().getByTid(task.id)
    model = get_model(mid)
    if blocking:
        for dataset in model_datasets:
            job = Job(mid, dataset.name)
            try_resume_bleu_computation(job)
            cmp.compute_one_blocking(job)
        return

    with multiprocessing.pool.Pool(4) as pool:
        for dataset in model_datasets:
            job = Job(mid, dataset.name)
            try_resume_bleu_computation(job)
            cmp.compute_one_async(pool, Job(mid, dataset.name))

        pool.close()
        pool.join()


def try_resume_bleu_computation(job: Job):
    """Flores BLEU scoring writes temp files on the server when doing the large track.
    Finding them will allow resuming from where we stopped.
    """
    tmp_dir = Path("/tmp/flores")
    candidates = sorted(tmp_dir.glob(job.job_name.replace("???", "*")))
    if candidates:
        candidate = candidates[-1]
        logger.info(
            f"Will resume bleu computation for {job.job_name} using {candidate}"
        )
        job.job_name = candidate.name


def ls(task: str = "", mid: int = 0, scores: bool = False) -> None:
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
        models = MODELS.getByTid(task_obj.id)
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


def get_model(mid: int) -> Model:
    return MODELS.getUnpublishedModelByMid(mid)


def get_task(model: Model) -> Task:
    return TASKS.dbs.query(Task).filter(Task.id == model.tid).one()


def get_shortname(taskname: str) -> str:
    return taskname.upper().replace("_", "-")


if __name__ == "__main__":
    func_argparse.main(eval, ls, build, takedown)
