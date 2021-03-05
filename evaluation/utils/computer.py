# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import pickle
import sys
import tempfile

import boto3

from metrics import get_job_metrics
from models.round import RoundModel


sys.path.append("../api")  # noqa
from models.score import ScoreModel  # isort:skip
from models.dataset import DatasetModel  # isort:skip

logger = logging.getLogger("computer")


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

    def parse_outfile(self, job):
        """
        Parse batch transform output by balancing brackets
        """
        output_s3_uri = self.datasets[job.dataset_name].get_output_s3_url(
            job.endpoint_name
        )
        parts = output_s3_uri.replace("s3://", "").split("/")
        s3_bucket = parts[0]
        s3_path = "/".join(parts[1:])
        tmp_pred_file = tempfile.mkstemp(prefix="predictions")[1]
        self.s3_client.download_file(s3_bucket, s3_path, tmp_pred_file)
        with open(tmp_pred_file) as f:
            tmp = ""
            predictions = []
            line = f.readline().strip()
            lb = 0
            while line:
                for c in line:
                    if c == "{":
                        lb += 1
                    elif c == "}":
                        lb -= 1
                if lb == 0 and tmp:
                    tmp += line
                    predictions.append(json.loads(tmp))
                    tmp = ""
                elif line:
                    tmp += line.replace("\n", "")
                line = f.readline().strip()
        os.remove(tmp_pred_file)
        return predictions

    def update_database(self, job):
        logger.info(f"Evaluating {job.job_name}")
        try:
            predictions = self.parse_outfile(job)
            eval_metrics_dict = self.datasets[job.dataset_name].eval(predictions)
            job_metrics_dict = get_job_metrics(job, self.datasets[job.dataset_name])
            score_obj = {**eval_metrics_dict, **job_metrics_dict}
            score_obj["model_id"] = job.model_id
            score_obj["raw_output_s3_uri"] = self.datasets[
                job.dataset_name
            ].get_output_s3_url(job.endpoint_name)

            dm = DatasetModel()
            d_entry = dm.getByName(job.dataset_name)
            score_obj["did"] = d_entry.id

            rm = RoundModel()
            # FIXME: note the rid in scores table is r_realid, pending issue #302
            if self.datasets[job.dataset_name].round_id != 0:
                score_obj["round_id"] = rm.getByTidAndRid(d_entry.tid, d_entry.rid).id
            else:
                score_obj["round_id"] = 0
            s = ScoreModel()
            s.create(**score_obj)
            return True
        except Exception as ex:
            logger.exception(f"Exception in computing metrics {ex}")
            return False

    def _get_job_metrics(self, job):
        "Compute job performance metrics: CpuUtilization, MemoryUtilization"
        return get_job_metrics(job)

    def update_status(self, jobs: list):
        if jobs:
            self._computing.extend(jobs)
            self._dump()

    def compute(self, N=1):
        if N == -1:
            N = len(self._computing)
        i = 0
        while self._computing and i < N:
            job = self._computing[0]
            if self.update_database(job):
                self._computing.pop(0)
            else:
                self._failed.append(self._computing.pop(0))
            i += 1
            self._dump()

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Computing":
            return self._computing
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def _dump(self):
        # dump status to pre-specified path
        status = {"computing": self._computing, "failed": self._failed}
        logger.info(
            f"Computer status: \n"
            + f"Evaluating jobs: {[job.job_name for job in status['computing']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Computer dumped status to {self._status_dump}")
