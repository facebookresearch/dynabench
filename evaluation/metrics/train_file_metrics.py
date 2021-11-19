# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sklearn.linear_model import LogisticRegression

from eval_config import eval_config

from .dataperf_dataloader import OpenImagesDataset


dataperf_metadata_path = eval_config.get("dataperf_metadata_path", None)
dataperf_train_path = eval_config.get("dataperf_train_path", None)
dataperf_test_path = eval_config.get("dataperf_test_path", None)

if (
    dataperf_metadata_path is not None
    and dataperf_train_path is not None
    and dataperf_test_path is not None
):
    train_dataset = OpenImagesDataset(
        dataperf_metadata_path, dataperf_train_path, split="train"
    )
    test_dataset = OpenImagesDataset(
        dataperf_metadata_path, dataperf_test_path, split="test"
    )


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
            train_X.append(train_dataset.embeddings[int(unique_id)])
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
                    [test_dataset.embeddings[int(obj["uid"])]]
                ):
                    differently_seeded_predictions[-1].append(label)
        preds_formatted.append(
            {
                "uid": obj["uid"],
                constructor_args["reference_name"]: differently_seeded_predictions,
            }
        )

    return preds_formatted
