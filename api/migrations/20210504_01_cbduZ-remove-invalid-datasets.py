# Copyright (c) Facebook, Inc. and its affiliates.

"""
Remove datasets from the DB that have been converted to tags within other datasets.
"""

from yoyo import step


__depends__ = {
    "20210429_01_zBzXQ-add-endpoint-name-to-models-table-and-remove-upload-"
    + "timestamp-column-which-is-now-redundant"
}

steps = [
    step(
        """
        DELETE FROM scores WHERE did in (SELECT id FROM datasets WHERE name in
        ("nli-st-antonym-matched", "nli-st-antonym-mismatched",
        "nli-st-length-mismatch-matched", "nli-st-length-mismatch-mismatched",
        "nli-st-negation-matched", "nli-st-negation-mismatched",
        "nli-st-numerical-reasoning", "nli-st-misspell-matched",
        "nli-st-misspell-mismatched", "nli-st-misspell-content-matched",
        "nli-st-misspell-content-mismatched", "nli-st-misspell-function-matched",
        "nli-st-misspell-function-mismatched", "nli-st-misspell-keyboard-matched",
        "nli-st-misspell-keyboard-mismatched", "nli-st-word-overlap-matched",
        "nli-st-word-overlap-mismatched", "hs-r1-test", "hs-r2-test", "hs-r3-test",
        "hs-r1-dev", "hs-r2-dev", "hs-r3-dev", "hatecheck-l-hate",
        "hatecheck-l-nothate", "hatecheck-f-slur-homonym-nh",
        "hatecheck-f-target-group-nh", "hatecheck-f-derog-neg-emote-h",
        "hatecheck-f-spell-space-del-h", "hatecheck-f-slur-h",
        "hatecheck-f-derog-neg-attrib-h", "hatecheck-f-slur-reclaimed-nh",
        "hatecheck-f-spell-leet-h", "hatecheck-f-ref-subs-clause-h",
        "hatecheck-f-threat-dir-h", "hatecheck-f-ident-pos-nh",
        "hatecheck-f-profanity-h", "hatecheck-f-spell-char-swap-h",
        "hatecheck-f-spell-space-add-h", "hatecheck-f-profanity-nh",
        "hatecheck-f-counter-quote-nh", "hatecheck-f-negate-neg-nh",
        "hatecheck-f-derog-impl-h", "hatecheck-f-ref-subs-sent-h",
        "hatecheck-f-phrase-opinion-h", "hatecheck-f-negate-pos-h",
        "hatecheck-f-derog-dehum-h", "hatecheck-f-phrase-question-h",
        "hatecheck-f-threat-norm-h", "hatecheck-f-ident-neutral-nh",
        "hatecheck-f-target-obj-nh", "hatecheck-f-counter-ref-nh",
        "hatecheck-f-target-indiv-nh", "hatecheck-f-spell-char-del-h",
        "hatecheck-t-none", "hatecheck-t-trans-people", "hatecheck-t-immigrants",
        "hatecheck-t-gay-people", "hatecheck-t-Muslims",
        "hatecheck-t-disabled-people", "hatecheck-t-women", "hatecheck-t-black-people"))
        """
    ),
    step(
        """
        DELETE FROM datasets WHERE name in
        ("nli-st-antonym-matched", "nli-st-antonym-mismatched",
        "nli-st-length-mismatch-matched", "nli-st-length-mismatch-mismatched",
        "nli-st-negation-matched", "nli-st-negation-mismatched",
        "nli-st-numerical-reasoning", "nli-st-misspell-matched",
        "nli-st-misspell-mismatched", "nli-st-misspell-content-matched",
        "nli-st-misspell-content-mismatched", "nli-st-misspell-function-matched",
        "nli-st-misspell-function-mismatched", "nli-st-misspell-keyboard-matched",
        "nli-st-misspell-keyboard-mismatched", "nli-st-word-overlap-matched",
        "nli-st-word-overlap-mismatched", "hs-r1-test", "hs-r2-test", "hs-r3-test",
        "hs-r1-dev", "hs-r2-dev", "hs-r3-dev", "hatecheck-l-hate",
        "hatecheck-l-nothate", "hatecheck-f-slur-homonym-nh",
        "hatecheck-f-target-group-nh", "hatecheck-f-derog-neg-emote-h",
        "hatecheck-f-spell-space-del-h", "hatecheck-f-slur-h",
        "hatecheck-f-derog-neg-attrib-h", "hatecheck-f-slur-reclaimed-nh",
        "hatecheck-f-spell-leet-h", "hatecheck-f-ref-subs-clause-h",
        "hatecheck-f-threat-dir-h", "hatecheck-f-ident-pos-nh",
        "hatecheck-f-profanity-h", "hatecheck-f-spell-char-swap-h",
        "hatecheck-f-spell-space-add-h", "hatecheck-f-profanity-nh",
        "hatecheck-f-counter-quote-nh", "hatecheck-f-negate-neg-nh",
        "hatecheck-f-derog-impl-h", "hatecheck-f-ref-subs-sent-h",
        "hatecheck-f-phrase-opinion-h", "hatecheck-f-negate-pos-h",
        "hatecheck-f-derog-dehum-h", "hatecheck-f-phrase-question-h",
        "hatecheck-f-threat-norm-h", "hatecheck-f-ident-neutral-nh",
        "hatecheck-f-target-obj-nh", "hatecheck-f-counter-ref-nh",
        "hatecheck-f-target-indiv-nh", "hatecheck-f-spell-char-del-h",
        "hatecheck-t-none", "hatecheck-t-trans-people", "hatecheck-t-immigrants",
        "hatecheck-t-gay-people", "hatecheck-t-Muslims",
        "hatecheck-t-disabled-people", "hatecheck-t-women", "hatecheck-t-black-people")
        """
    ),
]
