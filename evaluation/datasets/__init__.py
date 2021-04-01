# Copyright (c) Facebook, Inc. and its affiliates.

from datasets.hs import ahs
from datasets.nli import anli, mnli, snli
from datasets.qa import aqa
from datasets.sentiment import dynasent


def load_datasets():
    # This function is used in server to initialize all datasets
    datasets = {
        "mnli-dev-mismatched": mnli.MnliDevMismatched(),
        "mnli-dev-matched": mnli.MnliDevMatched(),
        "snli-dev": snli.SnliDev(),
        "snli-test": snli.SnliTest(),
        "anli-r1-dev": anli.AnliRound1Dev(),
        "anli-r1-test": anli.AnliRound1Test(),
        "anli-r2-dev": anli.AnliRound2Dev(),
        "anli-r2-test": anli.AnliRound2Test(),
        "anli-r3-dev": anli.AnliRound3Dev(),
        "anli-r3-test": anli.AnliRound3Test(),
        "dynasent-r1-test": dynasent.DynasentRound1Test(),
        "dynasent-r2-test": dynasent.DynasentRound2Test(),
        "aqa-r1-test": aqa.AqaRound1Test(),
        "hs-r1-test": ahs.AhsRound1Test(),
        "hs-r2-test": ahs.AhsRound2Test(),
        "hs-r3-test": ahs.AhsRound3Test(),
    }
    _verify_dataset(datasets)
    return datasets


def _verify_dataset(datasets: dict):
    for dataset in datasets:
        assert dataset == datasets[dataset].name, (
            f"{dataset} name does not match the attribute name "
            f"{datasets[dataset].name} from its defining class"
        )
