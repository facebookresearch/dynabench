# Copyright (c) Facebook, Inc. and its affiliates.

import json
import time
from datetime import datetime, timedelta

import boto3


def send_eval_request(model_id, dataset_name, config, logger=None):
    try:
        assert (
            model_id == "*" or isinstance(model_id, int) or isinstance(model_id, list)
        ), f"model_id can either be an integer, a list of integers, or *"
        assert (
            dataset_name == "*"
            or isinstance(dataset_name, str)
            or isinstance(dataset_name, list)
        ), f"dataset_name can either be a string, a list of strings, or *"
    except AssertionError as ex:
        if logger:
            logger.error(ex)
        return False
    else:
        session = boto3.Session(
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        sqs = session.resource("sqs")
        queue = sqs.get_queue_by_name(QueueName=config["evaluation_sqs_queue"])
        queue.send_message(
            MessageBody=json.dumps({"model_id": model_id, "dataset_name": dataset_name})
        )
        return True


def generate_job_name(endpoint_name, dataset_name):
    # :63 is AWS requirement; timestamp has fewer digits than uuid and should be
    # sufficient for dedup purpose
    return f"{endpoint_name}-{dataset_name}-{int(time.time())}"[:63]


def round_end_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo) + timedelta(seconds=offset)


def round_start_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo) - timedelta(seconds=offset)


def process_aws_metrics(datapoints):
    """
    Datapoints are a list of dictionaries with exactly the same keys
    """
    return sum([data["Average"] for data in datapoints]) / len(datapoints)
