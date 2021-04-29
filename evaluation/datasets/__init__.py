# Copyright (c) Facebook, Inc. and its affiliates.

import sys


sys.path.append("../api")  # noqa

from datasets.hs import ahs, hatecheck  # isort:skip
from datasets.nli import anli, hans, mnli, nli_st, snli  # isort:skip
from datasets.qa import aqa, mrqa_shared_dev  # isort:skip
from datasets.sentiment import amazon_review, dynasent, sst3, yelp_review  # isort:skip


def load_datasets():
    # This function is used in server to initialize all datasets
    datasets = {
        "hans": hans.Hans(),
        "nli-st-antonym-matched": nli_st.AntoynmMatched(),
        "nli-st-antonym-mismatched": nli_st.AntoynmMismatched(),
        "nli-st-length-mismatch-matched": nli_st.LengthMismatchMatched(),
        "nli-st-length-mismatch-mismatched": nli_st.LengthMismatchMismatched(),
        "nli-st-negation-matched": nli_st.NegationMatched(),
        "nli-st-negation-mismatched": nli_st.NegationMismatched(),
        "nli-st-numerical-reasoning": nli_st.NumericalReasoning(),
        "nli-st-misspell-matched": nli_st.MisspellMatched(),
        "nli-st-misspell-mismatched": nli_st.MisspellMismatched(),
        "nli-st-misspell-content-matched": nli_st.MisspellContentMatched(),
        "nli-st-misspell-content-mismatched": nli_st.MisspellContentMismatched(),
        "nli-st-misspell-function-matched": nli_st.MisspellFunctionMatched(),
        "nli-st-misspell-function-mismatched": nli_st.MisspellFunctionMismatched(),
        "nli-st-misspell-keyboard-matched": nli_st.MisspellKeyboardMatched(),
        "nli-st-misspell-keyboard-mismatched": nli_st.MisspellKeyboardMismatched(),
        "nli-st-word-overlap-matched": nli_st.WordOverlapMatched(),
        "nli-st-word-overlap-mismatched": nli_st.WordOverlapMismatched(),
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
        "hs-r1-test": ahs.AhsRound1Test(),
        "hs-r2-test": ahs.AhsRound2Test(),
        "hs-r3-test": ahs.AhsRound3Test(),
        "hs-r1-dev": ahs.AhsRound1Dev(),
        "hs-r2-dev": ahs.AhsRound2Dev(),
        "hs-r3-dev": ahs.AhsRound3Dev(),
        "hatecheck": hatecheck.HateCheckFull(),
        "hatecheck-l-hate": hatecheck.LabelHate(),
        "hatecheck-l-nothate": hatecheck.LabelNotHate(),
        "hatecheck-f-slur-homonym-nh": hatecheck.FunctionalitySlurHomonymNh(),
        "hatecheck-f-target-group-nh": hatecheck.FunctionalityTargetGroupNh(),
        "hatecheck-f-derog-neg-emote-h": hatecheck.FunctionalityDerogNegEmoteH(),
        "hatecheck-f-spell-space-del-h": hatecheck.FunctionalitySpellSpaceDelH(),
        "hatecheck-f-slur-h": hatecheck.FunctionalitySlurH(),
        "hatecheck-f-derog-neg-attrib-h": hatecheck.FunctionalityDerogNegAttribH(),
        "hatecheck-f-slur-reclaimed-nh": hatecheck.FunctionalitySlurReclaimedNh(),
        "hatecheck-f-spell-leet-h": hatecheck.FunctionalitySpellLeetH(),
        "hatecheck-f-ref-subs-clause-h": hatecheck.FunctionalityRefSubsClauseH(),
        "hatecheck-f-threat-dir-h": hatecheck.FunctionalityThreatDirH(),
        "hatecheck-f-ident-pos-nh": hatecheck.FunctionalityIdentPosNh(),
        "hatecheck-f-profanity-h": hatecheck.FunctionalityProfanityH(),
        "hatecheck-f-spell-char-swap-h": hatecheck.FunctionalitySpellCharSwapH(),
        "hatecheck-f-spell-space-add-h": hatecheck.FunctionalitySpellSpaceAddH(),
        "hatecheck-f-profanity-nh": hatecheck.FunctionalityProfanityNh(),
        "hatecheck-f-counter-quote-nh": hatecheck.FunctionalityCounterQuoteNh(),
        "hatecheck-f-negate-neg-nh": hatecheck.FunctionalityNegateNegNh(),
        "hatecheck-f-derog-impl-h": hatecheck.FunctionalityDerogImplH(),
        "hatecheck-f-ref-subs-sent-h": hatecheck.FunctionalityRefSubsSentH(),
        "hatecheck-f-phrase-opinion-h": hatecheck.FunctionalityPhraseOpinionH(),
        "hatecheck-f-negate-pos-h": hatecheck.FunctionalityNegatePosH(),
        "hatecheck-f-derog-dehum-h": hatecheck.FunctionalityDerogDehumH(),
        "hatecheck-f-phrase-question-h": hatecheck.FunctionalityPhraseQuestionH(),
        "hatecheck-f-threat-norm-h": hatecheck.FunctionalityThreatNormH(),
        "hatecheck-f-ident-neutral-nh": hatecheck.FunctionalityIdentNeutralNh(),
        "hatecheck-f-target-obj-nh": hatecheck.FunctionalityTargetObjNh(),
        "hatecheck-f-counter-ref-nh": hatecheck.FunctionalityCounterRefNh(),
        "hatecheck-f-target-indiv-nh": hatecheck.FunctionalityTargetIndivNh(),
        "hatecheck-f-spell-char-del-h": hatecheck.FunctionalitySpellCharDelH(),
        "hatecheck-t-none": hatecheck.TargetNone(),
        "hatecheck-t-trans-people": hatecheck.TargetTransPeople(),
        "hatecheck-t-immigrants": hatecheck.TargetImmigrants(),
        "hatecheck-t-gay-people": hatecheck.TargetGayPeople(),
        "hatecheck-t-Muslims": hatecheck.TargetMuslims(),
        "hatecheck-t-disabled-people": hatecheck.TargetDisabledPeople(),
        "hatecheck-t-women": hatecheck.TargetWomen(),
        "hatecheck-t-black-people": hatecheck.TargetBlackPeople(),
    }
    _verify_dataset(datasets)
    return datasets


def _verify_dataset(datasets: dict):
    for dataset in datasets:
        assert dataset == datasets[dataset].name, (
            f"{dataset} name does not match the attribute name "
            f"{datasets[dataset].name} from its defining class"
        )
