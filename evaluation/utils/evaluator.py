# Copyright (c) Facebook, Inc. and its affiliates.
import datetime
import logging
import pickle

import boto3


logger = logging.getLogger("evaluator")


class Job:
    def __init__(self, model_id, dataset, client, job_name=None):
        self.model_id = model_id
        self.dataset = dataset
        self.client = client
        self.job_name = job_name
        self.status = None
        self.endpoint_name = (
            "ts1611590776-zm-test-batchtransform"
        )  # fetch from database

    def generate_job_name(self):
        # TODO: add datetime to job name , make it unique
        return (
            f"{self.endpoint_name}-{self.dataset.task}-{self.dataset.name}"
            f"-{datetime.datetime.now().strftime('%I-%M-%p-%B-%d-%Y')}"
        )[:63].rstrip("-")

    def update_status(self):
        try:
            self.status = self.client.describe_transform_job(
                TransformJobName=self.job_name
            )
        except Exception as ex:
            logger.exception(ex)
        return self.status

    def submit(self):
        self.job_name = self.job_name or self.generate_job_name()
        try:
            self.dataset.run_eval(self.client, self.endpoint_name, self.job_name)
            self.status = self.client.describe_transform_job(
                TransformJobName=self.job_name
            )
        except Exception as ex:
            logger.exception(ex)
        logger.info(f"Submitted {self.job_name} for batch transform.")
        return self.status


class JobScheduler:
    # on __init__, initialize these variables either by loading
    # from dump, or set to empty
    # TODO: how to resolve data racing if there are multiple
    # scheduler instances in the future?

    def __init__(self, config):
        self._submitted, self._completed, self._failed = self._load_status(
            config["scheduler_status_dump"]
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
        job = Job(model_id, dataset, self.client)
        if job.submit():
            self._submitted.append(job)

    def _update(self):
        done_jobs = []
        for i, job in enumerate(self._submitted):
            job_status = job.update_status()
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
