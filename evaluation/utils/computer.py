# Copyright (c) Facebook, Inc. and its affiliates.

import json
import logging
import os
import sys
import tempfile

import boto3

from models.score import ScoreModel


sys.path.append("../api")

logger = logging.getLogger("computer")


class MetricsComputer:
    def __init__(self, config):
        # self.client = boto3.client(
        #     "cloudwatch",
        #     aws_access_key_id=config["aws_access_key_id"],
        #     aws_secret_access_key=config["aws_secret_access_key"],
        #     region_name=config["aws_region"]
        # )
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

    def parse_outfile(self, job):
        """
        Parse batch transform output by balancing brackets
        """
        output_s3_uri = job.dataset.get_output_s3_path(job.endpoint_name)
        parts = output_s3_uri.replace("s3://", "").split("/")
        s3_bucket = parts[0]
        s3_path = "/".join(parts[1:])
        tmp_dir = tempfile.TemporaryDirectory()
        tmp_file = os.path.join(tmp_dir.name, "predictions")
        self.s3_client.download_file(s3_bucket, s3_path, tmp_file)
        with open(tmp_file) as f:
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
                    predictions.append(tmp)
                    tmp = ""
                elif line:
                    tmp += line.replace("\n", "")
                line = f.readline().strip()
        return predictions

    def update_database(self, job):
        try:
            predictions = self.parse_outfile(job)
            score_obj = job.dataset.eval(predictions)
            perf_metrics = self._compute_perf_metrics(job)
            # TODO: add model eval status and update
            s = ScoreModel()
            s.bulk_create(
                model_id=job.model_id,
                score_objs=[score_obj],
                raw_upload_data=json.dumps(predictions),
                perf_metrics=perf_metrics,  # FIXME: placeholder
            )  # TODO: add columns for performance metrics
        except Exception as ex:
            logger.exception(f"Exception in computing metrics {ex}")

    def _compute_perf_metrics(self, job):
        "Compute job performance metrics: CpuUtilization, MemoryUtilization"
        return {}

    def compute_metrics(self, jobs: list):
        for job in jobs:
            self.update_database(job)
