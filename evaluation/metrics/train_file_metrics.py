# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import tempfile

import boto3
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

from eval_config import eval_config


s3_client = boto3.client(
    "s3",
    aws_access_key_id=eval_config["dataperf_aws_access_key_id"],
    aws_secret_access_key=eval_config["dataperf_aws_secret_access_key"],
    region_name=eval_config["dataperf_aws_region"],
)


def download_s3_dir(bucket, prefix, local):
    """
    params:
    - prefix: pattern to match in s3
    - local: local path to folder in which to place files
    - bucket: s3 bucket with target contents
    - client: initialized s3 client object
    """
    keys = []
    dirs = []
    next_token = ""
    base_kwargs = {
        "Bucket": bucket,
        "Prefix": prefix,
    }
    while next_token is not None:
        kwargs = base_kwargs.copy()
        if next_token != "":
            kwargs.update({"ContinuationToken": next_token})
        results = s3_client.list_objects_v2(**kwargs)
        contents = results.get("Contents")
        for i in contents:
            k = i.get("Key")
            if k[-1] != "/":
                keys.append(k)
            else:
                dirs.append(k)
        next_token = results.get("NextContinuationToken")
    for d in dirs:
        dest_pathname = os.path.join(local, d)
        if not os.path.exists(os.path.dirname(dest_pathname)):
            os.makedirs(os.path.dirname(dest_pathname))
    for k in keys:
        dest_pathname = os.path.join(local, k)
        if not os.path.exists(os.path.dirname(dest_pathname)):
            os.makedirs(os.path.dirname(dest_pathname))
        s3_client.download_file(bucket, k, dest_pathname)


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
    train_memo = {}

    def get_train_dataset_embedding(uid):
        if uid in train_memo:
            return train_memo[uid]
        else:
            with tempfile.NamedTemporaryFile() as tf:
                s3_client.download_fileobj(
                    "dataperf-embeddings",
                    "public_train_dataset_dynabench_formatted/train"
                    + str(uid)
                    + ".npy",
                    tf,
                )
                array = np.load(tf.name)
            train_memo[uid] = array
            return array

    test_memo = {}

    def get_test_dataset_embedding(uid):
        if uid in test_memo:
            return test_memo[uid]
        for label in constructor_args["test_labels"]:
            with tempfile.TemporaryDirectory() as td:
                download_s3_dir("dataperf-embeddings", label + "_test", td, s3_client)
                df = pd.read_parquet(td, engine="pyarrow")
                for _, row in df.iterrows():
                    array = np.array(row["Embedding"])
                    test_memo[row["ImageID"]] = array
        return test_memo[uid]

    label_to_binary_classifiers = {}
    for label, data in train.items():
        train_X = []
        train_y = []
        for unique_id, is_present in data.items():
            train_X.append(get_train_dataset_embedding(unique_id))
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
                    [get_test_dataset_embedding(obj["uid"])]
                ):
                    differently_seeded_predictions[-1].append(label)
        preds_formatted.append(
            {
                "uid": obj["uid"],
                constructor_args["reference_name"]: differently_seeded_predictions,
            }
        )

    return preds_formatted
