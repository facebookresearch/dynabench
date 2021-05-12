# Copyright (c) Facebook, Inc. and its affiliates.

import json

import datasets.mt.flores
from datasets.mt.flores import Flores101Base, Flores101Small1Dev
from metrics import metrics
from metrics.task_config import tasks_config


def test_eval():
    dataset = Flores101Small1Dev()
    prediction = {
        "id": "0-hu_HU-et_EE-dev",
        "source_language": "hu_HU",
        "source_text": (
            "Hétfőn a Stanford Egyetem Orvostudományi Kara bejelentette egy."
        ),
        "target_language": "et_EE",
        "translated_text": (
            "Esmaspäeval teatasid Stanfordi ülikooli meditsiinikooli teadlased."
        ),
        "signed": "0123456789abcdef",
    }
    target = {
        "id": "0-hu_HU-et_EE-dev",
        "answer": "Esmaspäeval teatasid Stanfordi leiutasid uue diagnostilise",
        "tags": ["src:hu_HU", "tgt:et_EE"],
    }
    bleu = metrics.get_bleu([prediction["translated_text"]], [target["answer"]])

    result = dataset.eval([prediction], [target])
    # assert bleu == result["perf"]
    scores = json.loads(result["metadata_json"])
    assert scores["bleu"] == bleu

    hu_score = next((s for s in scores["perf_by_tag"] if s["tag"] == "src:hu_HU"), None)
    assert hu_score["perf_dict"]["bleu"] == bleu
    et_score = next((s for s in scores["perf_by_tag"] if s["tag"] == "tgt:et_EE"), None)
    assert et_score["perf_dict"]["bleu"] == bleu


def test_flores_dataset():
    for name in dir(datasets.mt.flores):
        if name == "Flores101Base":
            continue
        dataset_cls = getattr(datasets.mt.flores, name)
        if not isinstance(dataset_cls, Flores101Base):
            continue

        assert dataset_cls().task in tasks_config
