# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.nli import mnli


def load_datasets():
    # This function is used in server to initialize all datasets
    datasets = {
        "mnli-dev-mismatched": mnli.MnliDevMismatched(),
        "mnli-dev-matched": mnli.MnliDevMatched(),
    }

    return datasets
