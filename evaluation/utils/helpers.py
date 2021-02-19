# Copyright (c) Facebook, Inc. and its affiliates.

from datetime import datetime, timedelta

from transformers.data.metrics.squad_metrics import compute_f1


def ceil_dt(dt, delta=timedelta(seconds=300), offset=60):
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo) + timedelta(seconds=offset)


def floor_dt(dt, delta=timedelta(seconds=300), offset=0):
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo) - timedelta(seconds=offset)


def process_aws_metrics(datapoints, metrics=("Average", "Maximum", "Minimum")):
    """
    Datapoints are a list of dictionaries with exactly the same keys
    """
    metric_func = {
        "Average": lambda dp: sum([data["Average"] for data in dp]) / len(dp),
        "Maximum": lambda dp: max([data["Maximum"] for data in dp]),
        "Minimum": lambda dp: min([data["Minimum"] for data in dp]),
    }
    result = {}
    for metric in metrics:
        if metric not in metric_func:
            raise NotImplementedError(f"Metric {metric} not supported")
        result[metric] = metric_func[metric](datapoints)
    result["Unit"] = datapoints[0]["Unit"]
    return result


# perf functions. propose to move to dynalab
def get_accuracy(predictions, targets):
    return sum([p == t for p, t in zip(predictions, targets)]) / len(targets)


def get_f1(predictions, targets):
    return sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)
