# Copyright (c) Facebook, Inc. and its affiliates.

from datetime import datetime, timedelta


def ceil_dt(dt, delta=timedelta(seconds=300)):
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo)


def floor_dt(dt, delta=timedelta(seconds=300)):
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo)
