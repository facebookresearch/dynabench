# Copyright (c) Facebook, Inc. and its affiliates.

import json

import datasets.mt.flores
import sacrebleu
from datasets.mt.flores import Flores101Base, Flores101Small1Dev
from metrics import metrics
from metrics.task_config import tasks_config


DATASET = Flores101Small1Dev()


def mk_sample(
    id: int,
    sourceLanguage: str,
    targetLanguage: str,
    sourceText: str,
    translatedText: str,
    answer: str,
):
    """Creates the prediction and target dicts"""
    gold_sample = {
        "uid": f"{id}-{sourceLanguage}-{targetLanguage}-unittest",
        "sourceLanguage": sourceLanguage,
        "targetLanguage": targetLanguage,
        "sourceText": sourceText,
        "targetText": answer,
        "signed": "0123456789abcdef",
    }
    target_sample = DATASET.label_field_converter(gold_sample)

    pred_sample = {
        "id": gold_sample["uid"],
        "sourceLanguage": gold_sample["sourceLanguage"],
        "targetLanguage": gold_sample["targetLanguage"],
        "sourceText": gold_sample["sourceText"],
        "translatedText": translatedText,
        "signed": gold_sample["signed"],
    }
    return pred_sample, target_sample


def test_eval():
    prediction, target = mk_sample(
        id=0,
        sourceLanguage="hu_HU",
        targetLanguage="et_EE",
        sourceText="Hétfőn a Stanford Egyetem Orvostudományi Kara bejelentette egy.",
        translatedText="Esmaspäeval teatasid Stanfordi ülikooli meditsiinikooli.",
        answer="Esmaspäeval teatasid Stanfordi leiutasid uue diagnostilise",
    )
    bleu = metrics.get_bleu([prediction["translatedText"]], [target["answer"]])

    result = DATASET.eval([prediction], [target])
    assert bleu == result["perf"]
    scores = json.loads(result["metadata_json"])
    print(result["metadata_json"])
    assert scores["bleu"] == bleu

    score = next((s for s in scores["perf_by_tag"] if s["tag"] == "hu_HU-et_EE"), None)
    assert score
    assert score["perf_dict"]["bleu"] == bleu


def test_corpus_bleu():

    pred_ru_en_0, tgt_ru_en_0 = mk_sample(
        id=0,
        sourceLanguage="ru_RU",
        targetLanguage="en_XX",
        sourceText="А Б В Г Д Е Ё",
        translatedText="A B B G D E yo",
        answer="A B V G D E yo",
    )

    pred_ru_en_1, tgt_ru_en_1 = mk_sample(
        id=1,
        sourceLanguage="ru_RU",
        targetLanguage="en_XX",
        sourceText="К Л М Н О П Р С Т",
        translatedText="K L M N O P R S T",
        answer="K L M N O P R S T",
    )

    pred_en_ru_0, tgt_en_ru_0 = mk_sample(
        id=0,
        sourceLanguage="en_XX",
        targetLanguage="ru_RU",
        sourceText="А Б В Г Д Е Ё",
        translatedText="A B B G D E yo",
        answer="A B V G D E yo",
    )

    ru_en_bleu = sacrebleu.corpus_bleu(
        [p["translatedText"] for p in [pred_ru_en_0, pred_ru_en_1]],
        [[t["answer"] for t in [tgt_ru_en_0, tgt_ru_en_1]]],
    )
    en_ru_bleu = sacrebleu.corpus_bleu(
        [pred_en_ru_0["translatedText"]], [[tgt_en_ru_0["answer"]]]
    )

    result = DATASET.eval(
        [pred_ru_en_0, pred_ru_en_1, pred_en_ru_0],
        [tgt_ru_en_0, tgt_ru_en_1, tgt_en_ru_0],
    )
    scores = json.loads(result["metadata_json"])
    ru_en_score = next(
        (s for s in scores["perf_by_tag"] if s["tag"] == "ru_RU-en_XX"), None
    )
    assert ru_en_score["perf_dict"]["bleu"] == ru_en_bleu.score
    en_ru_score = next(
        (s for s in scores["perf_by_tag"] if s["tag"] == "en_XX-ru_RU"), None
    )
    assert en_ru_score["perf_dict"]["bleu"] == en_ru_bleu.score


def test_flores_dataset():
    for name in dir(datasets.mt.flores):
        if name == "Flores101Base":
            continue
        dataset_cls = getattr(datasets.mt.flores, name)
        if not isinstance(dataset_cls, Flores101Base):
            continue

        assert dataset_cls().task in tasks_config
