# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import pickle
import tempfile

import boto3
from enum import Enum

from metrics import get_job_metrics
from models.dataset import DatasetModel
from models.round import RoundModel
from models.score import ScoreModel
from utils.helpers import parse_s3_uri, update_metadata_json_string


logger = logging.getLogger("computer")


class ComputeStatusEnum(Enum):
    successful = "successful"
    failed = "failed"
    postponed = "postponed"


class MetricsComputer:
    def __init__(self, config, datasets):
        self._status_dump = config["computer_status_dump"]
        self._computing, self._failed = self._load_status()
        self.datasets = datasets

        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

    def _load_status(self):
        try:
            status = pickle.load(open(self._status_dump, "rb"))
            logger.info(f"Load existing status from {self._status_dump}.")
            return status["computing"], status["failed"]
        except FileNotFoundError:
            logger.info("No existing computer status found. Re-initializing...")
            return [], []
        except Exception as ex:
            logger.exception(
                f"Exception in loading computer status: {ex}. Re-initializing..."
            )
            return [], []

    def update_database(self, job):
        logger.info(f"Evaluating {job.job_name}")
        try:
            dm = DatasetModel()
            d_entry = dm.getByName(job.dataset_name)
            sm = ScoreModel()
            s = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)
            if job.perturb_prefix and not s:
                logger.info(
                    f"Haven't received original evaluation for {job.job_name}. "
                    f"Postpone computation."
                )
                return ComputeStatusEnum.postponed

            # TODO: avoid explictly pass perturb prefix at multiple places
            # - take full job information at one interface instead
            dataset = self.datasets[job.dataset_name]
            eval_metrics_dict, delta_metrics_dict = dataset.compute_job_metrics(job)

            if job.perturb_prefix:
                eval_metadata_json = json.loads(eval_metrics_dict["metadata_json"])
                eval_metadata_json = {
                    f"{job.perturb_prefix}-{metric}": eval_metadata_json[metric]
                    for metric in eval_metadata_json
                }
                metadata_json = update_metadata_json_string(
                    s.metadata_json,
                    [
                        json.dumps(eval_metadata_json),
                        delta_metrics_dict["metadata_json"],
                    ],
                )

                score_obj = {**delta_metrics_dict, "metadata_json": metadata_json}
                sm.update(s.id, **score_obj)
            else:
                job_metrics_dict = get_job_metrics(job, dataset)
                score_obj = {**eval_metrics_dict, **job_metrics_dict}
                if s:
                    score_obj["metadata_json"] = update_metadata_json_string(
                        s.metadata_json, [score_obj["metadata_json"]]
                    )
                    sm.update(s.id, **score_obj)
                else:
                    score_obj["model_id"] = job.model_id
                    score_obj["did"] = d_entry.id
                    score_obj["raw_output_s3_uri"] = dataset.get_output_s3_url(
                        job.endpoint_name
                    )

                    rm = RoundModel()
                    if dataset.round_id != 0:
                        score_obj["r_realid"] = rm.getByTidAndRid(
                            d_entry.tid, d_entry.rid
                        ).id
                    else:
                        score_obj["r_realid"] = 0
                    sm.create(**score_obj)
            return ComputeStatusEnum.successful
        except Exception as ex:
            logger.exception(f"Exception in computing metrics {ex}")
            return ComputeStatusEnum.failed

    def update_status(self, jobs: list):
        if jobs:
            self._computing.extend(jobs)
            self.dump()

    def compute(self, N=1):
        n = len(self._computing)
        if N == -1:
            N = n
        computed, traversed = 0, 0
        while self._computing and computed < N and traversed < n:
            job = self._computing.pop(0)
            traversed += 1
            status = self.update_database(job)
            if status == ComputeStatusEnum.postponed:
                self._computing.append(job)
            else:
                computed += 1
                if status == ComputeStatusEnum.failed:
                    self._failed.append(job)
            self.dump()

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Computing":
            return self._computing
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def dump(self):
        # dump status to pre-specified path
        status = {"computing": self._computing, "failed": self._failed}
        logger.info(
            f"Computer status: \n"
            + f"Evaluating jobs: {[job.job_name for job in status['computing']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Computer dumped status to {self._status_dump}")
