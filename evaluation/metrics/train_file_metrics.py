# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
from sklearn.linear_model import LogisticRegression

from eval_config import eval_config

from .dataperf_dataloader import OpenImagesDataset


dataperf_data_path = eval_config.get("dataperf_data_path", None)

if dataperf_data_path is not None:
    train_dataset_embeddings = OpenImagesDataset(
        dataperf_data_path + "/saved_metadata",
        dataperf_data_path + "/saved_embeddings/train",
        split="train",
    ).embeddings
    test_dataset_embeddings = OpenImagesDataset(
        dataperf_data_path + "/saved_metadata",
        dataperf_data_path + "/saved_embeddings/test",
        split="test",
    ).embeddings


def get_train_dataset_embeddings(index):
    return np.random.rand(
        256
    )  # TODO make this come from the actual embeddings when dataperf finalizes
    # their dataset


def get_test_dataset_embeddings(index):
    return np.random.rand(
        256
    )  # TODO make this come from the actual embeddings when dataperf finalizes
    # their dataset


def dataperf(train, test, constructor_args):
    """
    Input:

    train: {"Dog": {"train_id_0": 1, "train_id_1": 0, "train_id_3": 1, ...},
        "Cat": {"train_id_0": 1, "train_id_2": 1, "train_id_3": 0 ...} ...}
    test: [{"uid": "test_id_0"}, {"uid": "test_id_1"}, ...]
    constructor_args: {"iterations": 5, "reference_name": "labels"}

    Output:

    preds_formatted: [{"uid": test_id_0, "labels": ["Cat", "Dog", ...]}, ...]
    """
    label_to_binary_classifiers = {}
    for label, data in train.items():
        train_X = []
        train_y = []
        for unique_id, is_present in data.items():
            train_X.append(get_train_dataset_embeddings(int(unique_id)))
            train_y.append(is_present)
        differently_seeded_classifiers = []
        for i in range(constructor_args["seeds"]):
            differently_seeded_classifiers.append(
                LogisticRegression(random_state=i).fit(train_X, train_y)
            )
        label_to_binary_classifiers[label] = differently_seeded_classifiers

    preds_formatted = []
    for obj in test:
        differently_seeded_predictions = []
        for i in range(constructor_args["seeds"]):
            differently_seeded_predictions.append([])
            for (
                label,
                differently_seeded_classifiers,
            ) in label_to_binary_classifiers.items():
                if differently_seeded_classifiers[i].predict(
                    [get_test_dataset_embeddings(int(obj["uid"]))]
                ):
                    differently_seeded_predictions[-1].append(label)
        preds_formatted.append(
            {
                "uid": obj["uid"],
                constructor_args["reference_name"]: differently_seeded_predictions,
            }
        )

    return preds_formatted
