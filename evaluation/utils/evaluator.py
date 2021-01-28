# Copyright (c) Facebook, Inc. and its affiliates.
import logging

import boto3

from utils.datasets import datasets


logger = logging.getLogger("evaluator")


class Job:
    def __init__(self, model_id, eval_id, client, job_name=None):
        self.model_id = model_id
        self.eval_id = eval_id
        self.client = client
        self.job_name = job_name
        self.status = None
        self.endpoint_name = ""  # fetch from database

    def generate_job_name(self):
        endpoint_name = ""
        # TODO: add datetime to job name , make it unique
        return f"{endpoint_name}-{self.eval_id}"

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
            datasets[self.eval_id].run_eval(
                self.client, self.endpoint_name, self.job_name
            )
            self.status = self.client.describe_transform_job(
                TransformJobName=self.job_name
            )
        except Exception as ex:
            logger.exception(ex)
        return self.status


class JobScheduler:
    # on __init__, initialize these variables either by loading
    # from dump, or set to empty
    # TODO: how to resolve data racing if there are multiple
    # scheduler instances in the future?
    _submitted = None
    _completed = None
    _failed = None
    _status_dump = ""

    def __init__(self, config):
        # TODO: load from a dump
        if JobScheduler._submitted is None:
            JobScheduler._submitted = []
        if JobScheduler._completed is None:
            JobScheduler._completed = []
        if JobScheduler._failed is None:
            JobScheduler._failed = []
        self.client = boto3.client(
            "sagemaker",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )  # TODO: with a client setting, maybe queues shouldn't be class variables

    def __exit__(self, exc_type, exc_value, traceback):
        self.dump()

    def submit(self, model_id, eval_id):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, eval_id, self.client)
        if job.submit():
            JobScheduler._submitted.append(job)

    def _update(self):
        done_jobs = []
        for i, job in enumerate(JobScheduler._submitted):
            job_status = job.update_status()
            if job_status["TransformJobStatus"] != "InProgress":
                done_jobs.append(i)
                if job_status["TransformJobStatus"] == "Completed":
                    JobScheduler._completed.append(job)
                elif job_status["TransformJobStatus"] == "Failed":
                    JobScheduler._failed.append(job)
        JobScheduler._submitted = [
            job for i, job in enumerate(JobScheduler._submitted) if i not in done_jobs
        ]

    def pop_jobs_for_eval(self, N=1):
        self._update()
        jobs = []
        for _ in range(N):
            jobs.append(JobScheduler._completed.pop())
        return jobs

    def dump(self):
        # dump status to pre-specified path
        pass
