# Copyright (c) Facebook, Inc. and its affiliates.

from datetime import datetime, timedelta

from transformers.data.metrics.squad_metrics import compute_f1


def ceil_dt(dt, delta=timedelta(seconds=300)):
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo)


def floor_dt(dt, delta=timedelta(seconds=300)):
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo)


# perf functions. propose to move to dynalab
def get_accuracy(predictions, targets):
    return sum([p == t for p, t in zip(predictions, targets)]) / len(targets)


def get_f1(predictions, targets):
    return sum([compute_f1(t, p) for p, t in zip(predictions, targets)]) / len(targets)
