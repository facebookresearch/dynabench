# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import pickle
import sys
import tempfile

import boto3
from enum import Enum

from metrics import get_job_metrics
from models.round import RoundModel
from utils.helpers import parse_s3_uri


sys.path.append("../api")  # noqa
from models.score import ScoreModel  # isort:skip
from models.dataset import DatasetModel  # isort:skip

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

    def parse_outfile(self, job, original=False):
        """
        Parse batch transform output by balancing brackets
        """
        perturb_prefix = None if original else job.perturb_prefix
        try:
            raw_output_s3_uri = self.datasets[job.dataset_name].get_output_s3_url(
                job.endpoint_name, raw=True, perturb_prefix=perturb_prefix
            )
            raw_s3_bucket, raw_s3_path = parse_s3_uri(raw_output_s3_uri)

            # download raw predictions and parse
            raw_pred_file = tempfile.mkstemp(prefix="predictions")[1]
            self.s3_client.download_file(raw_s3_bucket, raw_s3_path, raw_pred_file)
            with open(raw_pred_file) as f:
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
            os.remove(raw_pred_file)

            # upload parsed file
            output_s3_uri = self.datasets[job.dataset_name].get_output_s3_url(
                job.endpoint_name, raw=False, perturb_prefix=perturb_prefix
            )
            s3_bucket, s3_path = parse_s3_uri(output_s3_uri)
            parsed_pred_file = tempfile.mkstemp(prefix="predictions")[1]
            with open(parsed_pred_file, "w") as f:
                for pred in predictions:
                    f.write(json.dumps(pred) + "\n")
            self.s3_client.upload_file(parsed_pred_file, s3_bucket, s3_path)
            os.remove(parsed_pred_file)
        except Exception as e:
            logger.exception(f"Exception in parsing output file for {job.name}: {e}")
            return False
        return predictions

    def read_predictions(self, job, original=False):
        try:
            perturb_prefix = None if original else job.perturb_prefix
            output_s3_uri = self.datasets[job.dataset_name].get_output_s3_url(
                job.endpoint_name, raw=False, perturb_prefix=perturb_prefix
            )
            s3_bucket, s3_path = parse_s3_uri(output_s3_uri)
            tf = tempfile.mkstemp(prefix=self.name)[1]
            self.s3_client.download_file(s3_bucket, s3_path, tf)
            predictions = [json.loads(l) for l in open(tf).readlines()]
        except Exception:
            predictions = self.parse_outfile(job, original=original)
        finally:
            if not predictions:
                raise RuntimeError(
                    f"Error fetch predictions for job {job.name}, "
                    f"where request original output is {original}"
                )
            return predictions

    def update_database(self, job):
        logger.info(f"Evaluating {job.job_name}")
        try:
            dm = DatasetModel()
            d_entry = dm.getByName(job.dataset_name)
            sm = ScoreModel()
            if job.perturb_prefix:
                s = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)
                if not s:
                    logger.info(
                        f"Haven't received original evaluation for {job.job_name}. "
                        f"Postpone computation."
                    )
                    return ComputeStatusEnum.postponed

            # TODO: avoid explictly pass perturb prefix at multiple places
            # - take full job information at one interface instead
            dataset = self.datasets[job.dataset_name]
            predictions = self.parse_outfile(job)
            eval_metrics_dict = dataset.eval(
                predictions, perturb_prefix=job.perturb_prefix
            )

            if job.perturb_prefix:
                targets = self.read_predictions(job, original=True)
                targets = [
                    dataset.pred_to_target_converter(
                        dataset.pred_field_converter(prediction)
                    )
                    for prediction in targets
                ]

                delta_metrics_dict = dataset.eval(
                    predictions, targets, perturb_prefix=job.perturb_prefix
                )

                eval_metadata_json = json.loads(eval_metrics_dict["metadata_json"])
                eval_metadata_json = {
                    f"{job.perturb_prefix}-{metric}": eval_metadata_json[metric]
                    for metric in eval_metadata_json
                }
                original_metadata_json = json.loads(s.metadata_json)
                metadata_json = json.dumps(
                    {
                        **original_metadata_json,
                        **eval_metadata_json,
                        **json.loads(delta_metrics_dict["metadata_json"]),
                    }
                )

                score_obj = {**delta_metrics_dict, "metadata_json": metadata_json}
                sm.update(s.id, **score_obj)
            else:
                job_metrics_dict = get_job_metrics(job, dataset)
                score_obj = {**eval_metrics_dict, **job_metrics_dict}
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

    def _get_job_metrics(self, job):
        "Compute job performance metrics: CpuUtilization, MemoryUtilization"
        return get_job_metrics(job)

    def update_status(self, jobs: list):
        if jobs:
            self._computing.extend(jobs)
            self._dump()

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
