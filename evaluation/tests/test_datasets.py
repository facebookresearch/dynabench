# Copyright (c) Facebook, Inc. and its affiliates.

import pickle

from datasets import load_datasets


def test_all_dataset_are_pickable(monkeypatch):
    datasets = load_datasets()
    for name, dataset in datasets.items():
        pickle.dumps(dataset)
