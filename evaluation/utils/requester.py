# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import sys

from datasets import get_dataset_by_task
from utils.computer import MetricsComputer
from utils.evaluator import JobScheduler


sys.path.append("../api")  # noqa
from models.model import DeploymentStatusEnum, ModelModel  # isort:skip


logger = logging.getLogger("requester")


class Requester:
    def __init__(self, config, datasets):
        self.scheduler = JobScheduler(config, datasets)
        self.computer = MetricsComputer(config, datasets)

    def request(self, msg):
        model_ids = msg.get("model_id", None)
        dataset_names = msg.get("dataset_name", None)
        if not model_ids and dataset_names:
            logger.exception(
                f"Request failed. At least one of "
                f"model_id and dataset_name should be specified"
            )
        if model_ids and not isinstance(model_ids, list):
            model_ids = [model_ids]
        if dataset_names and not isinstance(dataset_names, list):
            dataset_names = [dataset_names]

        if model_ids and not dataset_names:
            for model_id in model_ids:
                logger.info(f"Request to evaluate model {model_id}")
                self._eval_model(model_id)
        elif dataset_names and not model_ids:
            for dataset_name in dataset_names:
                logger.info(f"Request to evaluate dataset {dataset_name}")
                self._eval_dataset(dataset_name)
        else:
            for model_id in model_ids:
                for dataset_name in dataset_names:
                    logger.info(
                        f"Request to evaluate model "
                        f"{model_id} on dataset {dataset_name}"
                    )
                    self._eval_model_on_dataset(model_id, dataset_name)

    def _eval_model_on_dataset(self, model_id, dataset_name):
        # evaluate a given model on given datasets
        self.scheduler.submit(model_id, dataset_name)

    def _eval_model(self, model_id):
        # given a model_id, evaluate all datasets for the
        # model's primary task
        m = ModelModel()
        task_id = m.getUnpublishedModelByMid(model_id).to_dict()["tid"]
        dataset_names = get_dataset_by_task(
            task_id
        )  # TODO: move datasets id to tasks db
        if dataset_names:
            for dataset_name in dataset_names:
                self._eval_model_on_dataset(model_id, dataset_name)

    def _eval_dataset(self, dataset_name):
        # given a dataset id, evaluate all models for the
        # dataset's task
        m = ModelModel()
        models = m.getByTaskCode(
            self.datasets[dataset_name].task
        )  # TODO: query db to get this
        if models:
            for model in models:
                if model.to_dict["deployment_status"] == DeploymentStatusEnum.deployed:
                    model_id = model.id
                    self._eval_model_on_dataset(model_id, dataset_name)

    def compute(self, N=1):
        jobs = self.scheduler.pop_jobs(status="Completed", N=N)
        self.computer.compute_metrics(jobs)

    def update_status(self):
        self.scheduler.update_status()

    def pending_jobs_to_compute(self):
        return (
            self.scheduler.pending_completed_jobs()
            or self.computer.pending_computing_jobs()
        )
