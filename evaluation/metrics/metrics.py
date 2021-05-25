# Copyright (c) Facebook, Inc. and its affiliates.
import functools
from pathlib import Path

import sacrebleu
import sentencepiece
from transformers.data.metrics.squad_metrics import compute_f1

from metrics.task_config import get_task_config_safe


# perf functions. propose to move to dynalab


# eval_metrics, take predictions and targets as input
def get_accuracy(predictions: list, targets: list):
    """
    Here, t can be a list of acceptable labels, instead of just one label. This is
    helpful if an evaluation dataset has fewer classes than a model was trained with.
    For example, say we want an nli model trained with contraditction, entailment,
    neutral labels to be evaluated on a dataset with entailment, not-entailment labels.
    """

    def equality(p, t):
        if isinstance(t, list):
            return p in t
        elif isinstance(t, str):
            return p == t
        else:
            raise TypeError("t must be a set of strings or a string")

    acc = sum([equality(p, t) for p, t in zip(predictions, targets)]) / len(targets)
    return round(acc * 100, 2)


def get_accuracy_meta(task=None):
    return {"unit": "%", "pretty_name": "Accuracy", "utility_direction": 1, "offset": 0}


def get_f1(predictions: list, targets: list):
    """
    Here, t can be a list of acceptable answers, instead of just one answer. There
    are often multiple acceptable answers to questions, as evidenced in the squad
    dataset. If t is a list of acceptable answers instead of just one answer, then
    the f1 of p and each item in t is computed, and the max f1 is used, per the
    squad evaluation standard.
    """

    def squad_f1_loop(t, p):
        if isinstance(t, list):
            if len(t) == 0:
                # Per the squad evaluation script
                t = [""]
            return max([compute_f1(t_answer, p) for t_answer in t])
        elif isinstance(t, str):
            return compute_f1(t, p)
        else:
            raise TypeError("t must be a list of strings or a string")

    f1 = sum([squad_f1_loop(t, p) for p, t in zip(predictions, targets)]) / len(targets)
    return round(f1 * 100, 2)


def get_f1_meta(task=None):
    return {"unit": "%", "pretty_name": "F1", "utility_direction": 1, "offset": 0}


# TODO: split into different functions for fairness and robustness.
def get_unperturbed_percent(predictions: list, targets: list, metric_func):
    total_unperturbed_weights, total = 0, 0
    for pl, t in zip(predictions, targets):
        if pl:
            total_unperturbed_weights += metric_func(pl, [t] * len(pl))
            total += 1
    return round(total_unperturbed_weights / total, 2)


def get_fairness_meta(task=None):
    return {"unit": "%", "pretty_name": "Fairness", "utility_direction": 1, "offset": 0}


def get_robustness_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Robustness",
        "utility_direction": 1,
        "offset": 0,
    }


# sacrebleu evaluation
def get_bleu(predictions: list, targets: list):
    bleu = sacrebleu.corpus_bleu(predictions, [targets])
    return bleu.score


def get_bleu_meta(task=None):
    return {"unit": "", "pretty_name": "BLEU", "utility_direction": 1, "offset": 0}


SPM_URL = (
    "https://dl.fbaipublicfiles.com/flores101/pretrained_models/sentencepiece.bpe.model"
)
SPM_PATH = Path(__file__).parent / "sentencepiece.bpe.model"


@functools.lru_cache()
def get_spm_model():
    if not SPM_PATH.exists():
        subprocess.check_call(["wget", SPM_URL, "-O", str(SPM_PATH)])
    spm = sentencepiece.SentencePieceProcessor()
    assert spm.Load(str(SPM_PATH)), f"Couldn't load spm model from {SPM_PATH}"
    return spm


def sp_tokenize(spm, sentence: str) -> str:
    words = spm.EncodeAsPieces(sentence.strip())
    return " ".join(words)


def get_sp_bleu(predictions: list, targets: list):
    spm = get_spm_model()
    spm_pred = [sp_tokenize(spm, pred) for pred in predictions]
    spm_targets = [sp_tokenize(spm, tgt) for tgt in targets]
    bleu = sacrebleu.corpus_bleu(spm_pred, [spm_targets], force=True)
    return bleu.score


def get_sp_bleu_meta(task=None):
    return {
        "unit": "",
        "pretty_name": "Sentence Piece BLEU",
        "utility_direction": 1,
        "offset": 0,
    }


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    mem = (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * get_task_config_safe(dataset.task)["instance_config"]["memory_gb"]
    )
    return round(mem, 2)


def get_memory_utilization_meta(task):
    return {
        "unit": "GiB",
        "pretty_name": "Memory",
        "utility_direction": -1,
        "offset": get_task_config_safe(task)["instance_config"]["memory_gb"],
    }


def get_examples_per_second(job, dataset):
    n_examples = dataset.get_n_examples()
    eps = (
        n_examples
        / (
            job.status["TransformEndTime"] - job.status["TransformStartTime"]
        ).total_seconds()
    )
    return round(eps, 2)


def get_examples_per_second_meta(task):
    return {
        "unit": "examples/second",
        "pretty_name": "Throughput",
        "utility_direction": 1,
        "offset": 0,
    }
