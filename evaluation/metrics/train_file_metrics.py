# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pickle

from sklearn.multioutput import MultiOutputClassifier
from sklearn.svm import LinearSVC


def dataperf(train, test, constructor_args):
    dataperf_embeddings = pickle.load("dataperf_embeddings.pkl")
    labels = set()
    for obj in train + test:
        labels = labels.union(set(obj[constructor_args["reference_name"]]))
    labels = list(labels)
    X = []
    y = []
    for obj in train:
        y.append(
            [
                1 if label in obj[constructor_args["reference_name"]] else 0
                for label in labels
            ]
        )
        X.append(dataperf_embeddings[obj["uid"]])

    preds_formatted = []
    for obj in test:
        preds_formatted.append(
            {"uid": obj["uid"], constructor_args["reference_name"]: []}
        )

    test_X = []
    for obj in test:
        test_X.append(dataperf_embeddings[obj["uid"]])

    for i in range(constructor_args["iterations"]):
        model = MultiOutputClassifier(LinearSVC(random_state=i)).fit(X, y)
        preds = model.predict(test_X)
        for preds_index in preds:
            pred = preds[preds_index]
            pred_formatted = []
            for pred_index in range(len(pred)):
                if pred[pred_index] == 1:
                    pred_formatted.append(labels[pred_index])
            preds_formatted[constructor_args["reference_name"]].append(pred_formatted)
    return preds_formatted
