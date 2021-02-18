# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import sys

from datasets import get_dataset_by_task


sys.path.append("../api")  # noqa
from models.model import DeploymentStatusEnum, ModelModel  # isort:skip


logger = logging.getLogger("requester")


class Requester:
    def __init__(self, scheduler, computer, datasets):
        self.scheduler = scheduler
        self.computer = computer
        self.datasets = datasets

    def request(self, msg):
        model_ids = msg.get("model_id", None)
        eval_ids = msg.get("eval_id", None)
        if not model_ids and eval_ids:
            logger.exception(
                f"Request failed. At least one of "
                f"model_id and eval_id should be specified"
            )
        if model_ids and not isinstance(model_ids, tuple):
            model_ids = (model_ids,)
        if eval_ids and not isinstance(eval_ids, tuple):
            eval_ids = (eval_ids,)

        if model_ids and not eval_ids:
            for model_id in model_ids:
                logger.info(f"Request to evaluate model {model_id}")
                self._eval_model(model_id)
        elif eval_ids and not model_ids:
            for eval_id in eval_ids:
                logger.info(f"Request to evaluate dataset {eval_id}")
                self._eval_dataset(eval_id)
        else:
            for model_id in model_ids:
                for eval_id in eval_ids:
                    logger.info(
                        f"Request to evaluate model {model_id} on dataset {eval_id}"
                    )
                    self._eval_model_on_dataset(model_id, eval_id)

    def _eval_model_on_dataset(self, model_id, eval_id):
        # evaluate a given model on given datasets
        self.scheduler.submit(model_id, self.datasets[eval_id])

    def _eval_model(self, model_id):
        # given a model_id, evaluate all datasets for the
        # model's primary task
        m = ModelModel()
        task_id = m.getUnpublishedModelByMid(model_id).to_dict()["tid"]
        eval_ids = get_dataset_by_task(task_id)  # TODO: move datasets id to tasks db
        if eval_ids:
            for eval_id in eval_ids:
                self._eval_model_on_dataset(model_id, eval_id)

    def _eval_dataset(self, eval_id):
        # given a dataset id, evaluate all models for the
        # dataset's task
        m = ModelModel()
        models = m.getByTaskCode(self.datasets[eval_id].task)
        if models:
            for model in models:
                if model.to_dict["deployment_status"] == DeploymentStatusEnum.deployed:
                    model_id = model.id
                    self._eval_model_on_dataset(model_id, eval_id)

    def compute(self, N=1):
        jobs = self.scheduler.pop_jobs(status="Completed", N=N)
        self.computer.compute_metrics(jobs)
