# Copyright (c) Facebook, Inc. and its affiliates.
import logging
import pickle
import sys
from datetime import datetime

import boto3
from dateutil.tz import tzlocal

from utils.helpers import (
    generate_job_name,
    process_aws_metrics,
    round_end_dt,
    round_start_dt,
)


sys.path.append("../api")  # noqa
from models.model import ModelModel  # isort:skip


logger = logging.getLogger("evaluator")


class Job:
    def __init__(self, model_id, dataset_name):
        self.model_id = model_id
        m = ModelModel()
        model = m.getUnpublishedModelByMid(model_id).to_dict()
        self.endpoint_name = f"ts{model['upload_timestamp']}-{model['name']}"
        self.dataset_name = dataset_name
        self.job_name = generate_job_name(self.endpoint_name, dataset_name)

        self.status = None  # will update once job is successfully submitted
        self.aws_metrics = {}  # will update once job is completed


class JobScheduler:
    def __init__(self, config, datasets):
        self._status_dump = config["scheduler_status_dump"]
        self._submitted, self._completed, self._failed = self._load_status()
        self.datasets = datasets
        self.sagemaker = boto3.client(
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

    def _load_status(self):
        try:
            status = pickle.load(open(self._status_dump, "rb"))
            logger.info(f"Load existing status from {self._status_dump}.")
            return status["submitted"], status["completed"], status["failed"]
        except FileNotFoundError:
            logger.info("No existing scheduler status found. Re-initializing...")
            return [], [], []
        except Exception as ex:
            logger.exception(
                f"Exception in loading scheduler status {ex}. Re-initializing"
            )
            return [], [], []

    def submit(self, model_id, dataset_name):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, dataset_name)

        def _submit(job):
            try:
                self.datasets[job.dataset_name].run_batch_transform(
                    self.sagemaker, job.endpoint_name, job.job_name
                )
            except Exception as ex:
                logger.exception(f"Exception in submitting job {job.job_name}: {ex}")
                return False
            else:
                self.status = self.sagemaker.describe_transform_job(
                    TransformJobName=job.job_name
                )
                logger.info(f"Submitted {job.job_name} for batch transform.")
                return True

        if _submit(job):
            self._submitted.append(job)
        else:
            self._failed.append(job)

    def update_status(self):
        def _update_job_status(job):
            try:
                job.status = self.sagemaker.describe_transform_job(
                    TransformJobName=job.job_name
                )
            except Exception as ex:
                logger.exception(ex)
            return job.status

        logger.info("Updating status")
        done_job_names = set()
        for job in self._submitted:
            _update_job_status(job)
            if job.status["TransformJobStatus"] != "InProgress":
                if job.status["TransformJobStatus"] == "Completed" and round_end_dt(
                    job.status["TransformEndTime"]
                ) < datetime.now(tzlocal()):
                    self._completed.append(job)
                    done_job_names.add(job.job_name)
                elif job.status["TransformJobStatus"] == "Failed":
                    self._failed.append(job)
                    done_job_names.add(job.job_name)
        self._submitted = [
            job for job in self._submitted if job.job_name not in done_job_names
        ]
        logger.info("Fetch metrics")
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
                                    StartTime=round_start_dt(
                                        job.status["TransformStartTime"]
                                    ),
                                    EndTime=round_end_dt(
                                        job.status["TransformEndTime"]
                                    ),
                                    Period=60,
                                    Statistics=["Average", "Maximum", "Minimum"],
                                )
                                if r["Datapoints"]:
                                    if m["MetricName"] not in job.aws_metrics:
                                        job.aws_metrics[m["MetricName"]] = {}
                                    job.aws_metrics[m["MetricName"]][
                                        host.split("/")[1]
                                    ] = process_aws_metrics(r["Datapoints"])
        # dump the updated status
        self._dump()

    def pop_jobs(self, status, N=1):
        def _pop_jobs(queue, N, status):
            results = []
            L = len(queue)
            if L == 0:
                logger.info(f"No {status} jobs yet. ")
            elif N == -1:
                results = queue
                queue = []
                logger.info(f"Popping all jobs out from {status} queue. ")
            else:
                if N > L:
                    logger.info(
                        f"Requested {N} but there are only {L} "
                        f"jobs to pop from {status} queue. "
                    )
                    N = L
                results = queue[:N]
                queue = queue[N:]
                logger.info(f"Poped {N} out of {L} jobs from {status} queue. ")
            return results, queue

        if status == "Completed":
            jobs, self._completed = _pop_jobs(self._completed, N, status)
        elif status == "Failed":
            jobs, self._failed = _pop_jobs(self._failed, N, status)
        else:
            raise NotImplementedError(f"Job status {status} not supported to pop")
        self._dump()
        return jobs

    # def __exit__(self, exc_type, exc_value, traceback):
    def _dump(self):
        # dump status to pre-specified path
        status = {
            "submitted": self._submitted,
            "completed": self._completed,
            "failed": self._failed,
        }
        logger.info(
            f"Scheduler status: \n"
            + f"Running jobs: {[job.job_name for job in status['submitted']]}\n"
            + f"completed jobs: {[job.job_name for job in status['completed']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Scheduler dumped status to {self._status_dump}")
