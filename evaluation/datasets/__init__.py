# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import sys


sys.path.append("../api")  # noqa
# TODO: find a way not to comment the follow imports to skip linter
from datasets.hs import (  # isort:skip
    adversarial_hatemoji,  # isort:skip
    ahs,  # isort:skip
    hatecheck,  # isort:skip
    hatemoji_check,  # isort:skip
)  # isort:skip
from datasets.mt import flores  # isort:skip
from datasets.nli import anli, hans, mnli, nli_st, snli, sg_winogender  # isort:skip
from datasets.qa import aqa, mrqa_shared_dev  # isort:skip
from datasets.sentiment import amazon_review, dynasent, sst3, yelp_review  # isort:skip


def load_datasets():
    # This function is used in server to initialize all datasets
    datasets = {
        "superglue-winogender": sg_winogender.SuperglueWinogender(),
        "hans": hans.Hans(),
        "nli-stress-test": nli_st.NLIStressTest(),
        "mnli-dev-mismatched": mnli.MnliDevMismatched(),
        "mnli-dev-matched": mnli.MnliDevMatched(),
        "mnli-test-mismatched": mnli.MnliTestMismatched(),
        "mnli-test-matched": mnli.MnliTestMatched(),
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
        "dynasent-r1-dev": dynasent.DynasentRound1Dev(),
        "dynasent-r2-dev": dynasent.DynasentRound2Dev(),
        "amazon-review-test": amazon_review.AmazonReviewTest(),
        "amazon-review-dev": amazon_review.AmazonReviewDev(),
        "yelp-review-test": yelp_review.YelpReviewTest(),
        "yelp-review-dev": yelp_review.YelpReviewDev(),
        "sst3-test": sst3.Sst3Test(),
        "sst3-dev": sst3.Sst3Dev(),
        "aqa-r1-test": aqa.AqaRound1Test(),
        "aqa-r1-dev": aqa.AqaRound1Dev(),
        "bio-asq-dev": mrqa_shared_dev.BioAsq(),
        "drop-dev": mrqa_shared_dev.Drop(),
        "duo-rc-paraphrase-rc-dev": mrqa_shared_dev.DuoRcParaphraseRc(),
        "hotpot-qa-dev": mrqa_shared_dev.HotpotQa(),
        "natural-questions-short-dev": mrqa_shared_dev.NaturalQuestionsShort(),
        "news-qa-dev": mrqa_shared_dev.NewsQa(),
        "race-dev": mrqa_shared_dev.Race(),
        "relation-extraction-dev": mrqa_shared_dev.RelationExtraction(),
        "search-qa-dev": mrqa_shared_dev.SearchQa(),
        "squad-dev": mrqa_shared_dev.Squad(),
        "textbook-qa-dev": mrqa_shared_dev.TextbookQa(),
        "trivia-qa-web-dev": mrqa_shared_dev.TriviaQaWeb(),
        "ahs-r1-test": ahs.AhsRound1Test(),
        "ahs-r2-test": ahs.AhsRound2Test(),
        "ahs-r3-test": ahs.AhsRound3Test(),
        "ahs-r4-test": ahs.AhsRound4Test(),
        "ahs-r5-test": adversarial_hatemoji.AhsRound5Test(),
        "ahs-r6-test": adversarial_hatemoji.AhsRound6Test(),
        "ahs-r7-test": adversarial_hatemoji.AhsRound7Test(),
        "ahs-r1-dev": ahs.AhsRound1Dev(),
        "ahs-r2-dev": ahs.AhsRound2Dev(),
        "ahs-r3-dev": ahs.AhsRound3Dev(),
        "ahs-r4-dev": ahs.AhsRound4Dev(),
        "ahs-r5-dev": adversarial_hatemoji.AhsRound5Dev(),
        "ahs-r6-dev": adversarial_hatemoji.AhsRound6Dev(),
        "ahs-r7-dev": adversarial_hatemoji.AhsRound7Dev(),
        "hatecheck": hatecheck.HateCheck(),
        "hatemoji-check": hatemoji_check.HatemojiCheck(),
        "flores101-full-dev": flores.Flores101FullDev(),
        "flores101-full-devtest": flores.Flores101FullDevTest(),
        "flores101-full-test": flores.Flores101FullTest(),
        "flores101-small1-dev": flores.Flores101Small1Dev(),
        "flores101-small1-devtest": flores.Flores101Small1DevTest(),
        "flores101-small1-test": flores.Flores101Small1Test(),
        "flores101-small2-dev": flores.Flores101Small2Dev(),
        "flores101-small2-devtest": flores.Flores101Small2DevTest(),
        "flores101-small2-test": flores.Flores101Small2Test(),
    }
    _verify_dataset(datasets)
    return datasets


def _verify_dataset(datasets: dict):
    for dataset in datasets:
        assert dataset == datasets[dataset].name, (
            f"{dataset} name does not match the attribute name "
            f"{datasets[dataset].name} from its defining class"
        )
