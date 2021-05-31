# Copyright (c) Facebook, Inc. and its affiliates.
import logging
import pickle
import time
from datetime import datetime

import boto3
import botocore
from dateutil.tz import tzlocal

from models.model import ModelModel
from utils.helpers import (
    generate_job_name,
    process_aws_metrics,
    round_end_dt,
    round_start_dt,
)


logger = logging.getLogger("evaluator")


class Job:
    def __init__(self, model_id, dataset_name, perturb_prefix=None):
        self.model_id = model_id
        m = ModelModel()
        model = m.getUnpublishedModelByMid(model_id)
        self.endpoint_name = model.endpoint_name
        self.dataset_name = dataset_name
        self.perturb_prefix = perturb_prefix
        self.job_name = generate_job_name(
            self.endpoint_name, dataset_name, perturb_prefix
        )

        self.status = None  # will update once job is successfully submitted
        self.aws_metrics = {}  # will update once job is completed

    def __repr__(self) -> str:
        return f"<Job: {self.job_name}>"


class JobScheduler:
    def __init__(self, config, datasets):
        self._status_dump = config["scheduler_status_dump"]
        self._submitted, self._queued, self._completed, self._failed = (
            self._load_status()
        )
        self.max_submission = config["max_submission"]
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
            return (
                status.get("submitted", []),
                status.get("queued", []),
                status.get("completed", []),
                status.get("failed", []),
            )
        except FileNotFoundError:
            logger.info("No existing scheduler status found. Re-initializing...")
            return [], [], [], []

    def enqueue(self, model_id, dataset_name, perturb_prefix=None, dump=True):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, dataset_name, perturb_prefix)
        self._queued.append(job)
        logger.info(f"Queued {job.job_name} for submission")

        if dump:
            self.dump()

    def submit(self):
        def _create_batch_transform(job):
            """
            Return True if a job is successfully submitted
            """
            try:
                self.datasets[job.dataset_name].run_batch_transform(
                    self.sagemaker, job.endpoint_name, job.job_name, job.perturb_prefix
                )
            except self.sagemaker.exceptions.ResourceLimitExceeded as ex:
                logger.exception(
                    f"Requeueing job {job.job_name} due to AWS limit exceeds."
                )
                logger.debug(f"{ex}")
                self._queued.append(job)
                return False
            except self.sagemaker.exceptions.ResourceInUse as ex:
                logger.exception(
                    f"Job {job.job_name} already submitted. Re-computing the metrics."
                )
                logger.debug(f"{ex}")
                self._submitted.append(job)
                return True
            except botocore.exceptions.ClientError as ex:
                if ex.response["Error"]["Code"] == "ThrottlingException":
                    logger.exception(
                        f"Sleep for 2s and requeuing job {job.job_name} "
                        f"due to AWS throttling"
                    )
                    logger.debug(f"{ex}")
                    self._queued.append(job)
                    time.sleep(2)
                else:
                    logger.exception(
                        f"Exception in submitting job {job.job_name}: {ex}"
                    )
                    self._failed.append(job)
                return False
            except Exception as ex:
                logger.exception(f"Exception in submitting job {job.job_name}: {ex}")
                self._failed.append(job)
                return False
            else:
                logger.info(f"Submitted {job.job_name} for batch transform.")
                self._submitted.append(job)
                return True

        # Submit remaining jobs
        N_to_submit = min(self.max_submission - len(self._submitted), len(self._queued))
        if N_to_submit > 0:
            for _ in range(N_to_submit):
                job = self._queued.pop(0)
                _create_batch_transform(job)
            self.dump()

    def stop(self, job):
        try:
            self.sagemaker.stop_transform_job(TransformJobName=job.job_name)
        except Exception as ex:
            logger.exception(f"Error in stopping {job.job_name}: {ex}")
        else:
            logger.info(f"Stopped batch transform job {job.job_name}")

    def update_status(self):
        def _update_job_status(job):
            try:
                job.status = self.sagemaker.describe_transform_job(
                    TransformJobName=job.job_name
                )
            except Exception as ex:
                logger.exception(ex)
                logger.info(f"Postponing fetching status for {job.job_name}")
                return False
            else:
                return True

        logger.info("Updating status")
        done_job_names = set()
        for job in self._submitted:
            if _update_job_status(job):
                if job.status["TransformJobStatus"] != "InProgress":
                    if job.status["TransformJobStatus"] != "Completed":
                        self._failed.append(job)
                        done_job_names.add(job.job_name)
                    elif job.perturb_prefix or round_end_dt(
                        job.status["TransformEndTime"]
                    ) < datetime.now(tzlocal()):
                        self._completed.append(job)
                        done_job_names.add(job.job_name)
        self._submitted = [
            job for job in self._submitted if job.job_name not in done_job_names
        ]
        logger.info("Fetch metrics")
        # fetch AWS metrics for completed jobs
        for job in self._completed:
            if not job.aws_metrics and not job.perturb_prefix:
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
                                    Statistics=["Average"],
                                )
                                if r["Datapoints"]:
                                    if m["MetricName"] not in job.aws_metrics:
                                        job.aws_metrics[m["MetricName"]] = []
                                    job.aws_metrics[m["MetricName"]].append(
                                        process_aws_metrics(r["Datapoints"])
                                    )
        # dump the updated status
        self.dump()

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
        if jobs:
            self.dump()
        return jobs

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Completed":
            return self._completed
        elif status == "Submitted":
            return self._submitted
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def dump(self):
        # dump status to pre-specified path
        status = {
            "submitted": self._submitted,
            "queued": self._queued,
            "completed": self._completed,
            "failed": self._failed,
        }
        logger.info(
            f"Scheduler status: \n"
            + f"Running jobs: {[job.job_name for job in status['submitted']]}\n"
            + f"Queued jobs: {[job.job_name for job in status['queued']]}\n"
            + f"completed jobs: {[job.job_name for job in status['completed']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Scheduler dumped status to {self._status_dump}")
