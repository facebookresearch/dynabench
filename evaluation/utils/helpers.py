# Copyright (c) Facebook, Inc. and its affiliates.

from datetime import datetime, timedelta


def generate_job_name(endpoint_name, dataset_name):
    # TODO: add datetime to job name , make it unique
    return (
        f"test-{endpoint_name}-{dataset_name}"
        f"-{datetime.now().strftime('%I-%M-%p-%B-%d-%Y')}"
    )[:63].rstrip("-")


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
