# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.nli import mnli


def load_datasets():
    # This function is used in server to initialize all datasets
    datasets = {
        "mnli-dev-mismatched": mnli.MnliDevMismatched(),
        "mnli-dev-matched": mnli.MnliDevMatched(),
    }

    return datasets


def get_dataset_by_task(task):
    # TODO: this is a demo of the idea, how to fetch all datasets from that task
    # I think there is a better idea to deal with this once load_datasets is called,
    # but write it here to remind that requester needs something like this
    if task == "nli" or task == 5:
        return ["mnli-dev-mismatched", "mnli-dev-matched"]
