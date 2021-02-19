# Copyright (c) Facebook, Inc. and its affiliates.
import datetime
import logging
import pickle
import sys

import boto3

from utils.helpers import ceil_dt, floor_dt


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
        self.job_name = self.generate_job_name(self.endpoint_name, dataset)

        self.status = None  # will update once job is successfully submitted
        self.aws_metrics = {}  # will update once job is completed

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
        self.cloudwatchlog = boto3.client(
            "logs",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        self.cloudwatch = boto3.client(
            "cloudwatch",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        self.cloudwatch_namespace = "/aws/sagemaker/TransformJobs"

    def _load_status(self, status_dump):
        try:
            status = pickle.load(open(status_dump, "rb"))
            return status["submitted"], status["completed"], status["failed"]
        except FileNotFoundError:
            logger.info("No existing scheduler status found. Re-initializing...")
            return [], [], []
        except Exception as ex:
            logger.exception(
                f"Exception in loading scheduler status {ex}. Re-initializing"
            )
            return [], [], []

    def submit(self, model_id, dataset):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, dataset)
        if job.submit(self.client):
            self._submitted.append(job)
        else:
            self._failed.append(job)

    def update_status(self):
        done_job_names = set()
        for job in self._submitted:
            job_status = job.update_status(self.client)
            if job_status["TransformJobStatus"] != "InProgress":
                done_job_names.add(job.job_name)
                if job_status["TransformJobStatus"] == "Completed":
                    self._completed.append(job)
                elif job_status["TransformJobStatus"] == "Failed":
                    self._failed.append(job)
        self._submitted = [
            job for job in self._submitted if job.job_name not in done_job_names
        ]

        # fetch AWS metrics for completed jobs
        for job in self._completed:
            if not job.aws_metrics:
                logStreams = self.cloudwatchlog.describe_log_streams(
                    logGroupName=self.cloudwatch_namespace,
                    logStreamNamePrefix=f"{job.job_name}/",
                )["logStreams"]
                if logStreams:
                    hosts = set()
                    for logStream in logStreams:
                        if logStream["logStreamName"].count("/") == 1:
                            hosts.add(
                                "-".join(logStream["logStreamName"].split("-")[:-1])
                            )  # each host is a machine instance
                    for host in hosts:
                        metrics = self.cloudwatch.list_metrics(
                            Namespace=self.cloudwatch_namespace,
                            Dimensions=[{"Name": "Host", "Value": host}],
                        )
                        if metrics["Metrics"]:
                            for m in metrics["Metrics"]:
                                r = self.cloudwatch.get_metric_statistics(
                                    Namespace=m["Namespace"],
                                    MetricName=m["MetricName"],
                                    Dimensions=m["Dimensions"],
                                    StartTime=floor_dt(
                                        job.status["TransformStartTime"]
                                    ),
                                    EndTime=ceil_dt(job.status["TransformEndTime"]),
                                    Period=300,
                                    Statistics=["Average", "Maximum", "Minimum"],
                                )
                                if r["Datapoints"]:
                                    if m["MetricName"] not in job.aws_metrics:
                                        job.aws_metrics[m["MetricName"]] = {}
                                    job.aws_metrics[m["MetricName"]][
                                        host.split("/")[1]
                                    ] = r["Datapoints"][0]

        # dump the updated status
        self.dump()

    def pop_jobs(self, status, N=1):
        if status == "Completed":
            queue = self._completed
        elif status == "Failed":
            queue = self._failed
        else:
            raise NotImplementedError(f"Job status {status} not supported to pop")
        jobs = []
        if len(queue) == 0:
            logger.exception(f"No {status.lower()} jobs to pop yet.")
        else:
            for _ in range(min(len(queue), N)):
                jobs.append(queue.pop(0))
        return jobs

    # def __exit__(self, exc_type, exc_value, traceback):
    def dump(self):
        # dump status to pre-specified path
        status = {
            "submitted": self._submitted,
            "completed": self._completed,
            "failed": self._failed,
        }
        logger.info(
            f"Running jobs: {[job.job_name for job in status['submitted']]}\n"
            + f"completed jobs: {[job.job_name for job in status['completed']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Scheduler dumped status to {self._status_dump}")
