# Copyright (c) Facebook, Inc. and its affiliates.
import datetime
import logging
import pickle
import sys

import boto3


sys.path.append("../api")  # noqa
from models.model import ModelModel  # isort:skip


logger = logging.getLogger("evaluator")


class Job:
    def __init__(self, model_id, dataset):
        self.model_id = model_id
        m = ModelModel()
        model = m.getUnpublishedModelByMid(model_id).to_dict()
        self.endpoint_name = f"ts{model['upload_timestamp']}-{model['name']}"
        self.dataset = dataset
        self.status = None
        self.job_name = self.generate_job_name(self.endpoint_name, dataset)

    def generate_job_name(self, endpoint_name, dataset):
        # TODO: add datetime to job name , make it unique
        return (
            f"{endpoint_name}-{dataset.task}-{dataset.name}"
            f"-{datetime.datetime.now().strftime('%I-%M-%p-%B-%d-%Y')}"
        )[:63].rstrip("-")

    def update_status(self, client):
        try:
            self.status = client.describe_transform_job(TransformJobName=self.job_name)
        except Exception as ex:
            logger.exception(ex)
        return self.status

    def submit(self, client):
        try:
            self.dataset.run_eval(client, self.endpoint_name, self.job_name)
        except Exception as ex:
            logger.exception(f"Exception in submitting job {self.job_name}: {ex}")
            return False
        else:
            self.status = client.describe_transform_job(TransformJobName=self.job_name)
            logger.info(f"Submitted {self.job_name} for batch transform.")
            return True


class JobScheduler:
    def __init__(self, config):
        self._status_dump = config["scheduler_status_dump"]
        self._submitted, self._completed, self._failed = self._load_status(
            self._status_dump
        )
        self.client = boto3.client(
            "sagemaker",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

    def __exit__(self, exc_type, exc_value, traceback):
        self._dump()

    def _load_status(self, status_dump):
        try:
            status = pickle.load(open(status_dump))
            return status["submitted"], status["completed"], status["failed"]
        except Exception as ex:
            logger.exception(ex)
            return [], [], []

    def submit(self, model_id, dataset):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, dataset)
        if job.submit(self.client):
            self._submitted.append(job)
        else:
            self._failed.append(job)

    def _update(self):
        done_jobs = []
        for i, job in enumerate(self._submitted):
            job_status = job.update_status(self.client)
            if job_status["TransformJobStatus"] != "InProgress":
                done_jobs.append(i)
                if job_status["TransformJobStatus"] == "Completed":
                    self._completed.append(job)
                elif job_status["TransformJobStatus"] == "Failed":
                    self._failed.append(job)
        self._submitted = [
            job for i, job in enumerate(self._submitted) if i not in done_jobs
        ]

    def pop_jobs_for_eval(self, N=1):
        self._update()
        jobs = []
        if len(self._completed) == 0:
            logger.exception("No completed jobs yet.")
        else:
            for _ in range(min(len(self._completed), N)):
                jobs.append(self._completed.pop())
        return jobs

    def _dump(self):
        # dump status to pre-specified path
        status = {
            "submitted": self._submitted,
            "completed": self._completed,
            "failed": self._failed,
        }
        pickle.dump(status, self._status_dump)
