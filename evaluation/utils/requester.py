# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import sys

from metrics.task_config import get_task_config_safe
from models.dataset import DatasetModel
from utils.computer import MetricsComputer
from utils.evaluator import JobScheduler
from utils.helpers import get_perturb_prefix


sys.path.append("../api")  # noqa
from models.task import TaskModel  # isort:skip
from models.model import DeploymentStatusEnum, ModelModel  # isort:skip


logger = logging.getLogger("requester")


class Requester:
    def __init__(self, config, datasets):
        self.scheduler = JobScheduler(config, datasets)
        self.computer = MetricsComputer(config, datasets)
        self.datasets = datasets

    def request(self, msg):
        model_ids = msg.get("model_id", None)
        dataset_names = msg.get("dataset_name", None)
        if model_ids == "*":
            model_ids = None
        if dataset_names == "*":
            dataset_names = None
        if not model_ids and not dataset_names:
            logger.exception(
                f"Request failed. At least one of "
                f"model_id and dataset_name should be specified"
            )
            return False
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
                    self._eval_model_on_dataset(model_id, dataset_name)
        self.scheduler._dump()
        return True

    def _eval_model_on_dataset(self, model_id, dataset_name):
        # evaluate a given model on given datasets
        try:
            dataset_name, perturb_prefix = get_perturb_prefix(
                dataset_name, self.datasets
            )
        except RuntimeError as ex:
            logger.exception(ex)
        else:
            self.scheduler.submit(model_id, dataset_name, perturb_prefix)
            if not perturb_prefix:
                dataset = self.datasets[dataset_name]
                task_config = get_task_config_safe(dataset.task)
                for prefix in task_config["delta_metrics"]:
                    if dataset.dataset_available_on_s3(prefix):
                        self.scheduler.submit(
                            model_id, dataset_name, prefix, dump=False
                        )

    def _eval_model(self, model_id):
        # given a model_id, evaluate all datasets for the
        # model's primary task
        m = ModelModel()
        tid = m.getUnpublishedModelByMid(model_id).tid
        d = DatasetModel()
        datasets = d.getByTid(tid)
        if tid and datasets:
            dataset_names = [dataset.name for dataset in datasets]
            for dataset_name in dataset_names:
                self._eval_model_on_dataset(model_id, dataset_name)
        else:
            if not tid:
                logger.exception(f"Task not found for model {model_id}")
            else:
                logger.warning(f"No datasets are available for task {tid}")

    def _eval_dataset(self, dataset_name):
        # given a dataset id, evaluate all models for the
        # dataset's task
        t = TaskModel()
        tid = t.getByTaskCode(self.datasets[dataset_name].task).id
        m = ModelModel()
        models = m.getByTid(tid)
        if tid and models:
            for model in models:
                if model.deployment_status == DeploymentStatusEnum.deployed:
                    self._eval_model_on_dataset(model.id, dataset_name)
        else:
            if not tid:
                logger.exception(f"Task not found for dataset {dataset_name}")
            else:
                logger.warning(f"No models are available for task {tid}")

    def update_status(self):
        self.scheduler.update_status()
        jobs = self.scheduler.pop_jobs(status="Completed", N=-1)
        self.computer.update_status(jobs)

    def compute(self, N=1):
        self.computer.compute(N=N)

    def get_failed_jobs(self, status):
        return self.scheduler.get_jobs(status="Failed") + self.computer.get_jobs(
            status="Failed"
        )
