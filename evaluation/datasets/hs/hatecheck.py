# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger

from .base import AccessTypeEnum, HsBase


class HateCheck(HsBase):
    def __init__(
        self,
        name,
        functionality=None,
        target=None,
        label=None,
        round_id=0,
        access_type=AccessTypeEnum.standard,
    ):
        rootpath = os.path.dirname(sys.path[0])
        self.functionality = functionality
        self.target = target
        self.label = label
        self.local_path = os.path.join(
            rootpath, "data", "hs/hatecheck/test_suite_cases_formatted.jsonl"
        )
        super().__init__(name=name, round_id=round_id, access_type=access_type)

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for line in open(self.local_path).readlines():
                    jl = json.loads(line)
                    tmp_jl = {
                        "uid": jl["id"],
                        "context": jl["text"],
                        "label": jl["answer"],
                    }
                    if self.functionality is not None:
                        if self.target is not None:
                            if self.label is not None:
                                if (
                                    jl["functionality"] == self.functionality
                                    and jl["target"] == self.target
                                    and jl["answer"] == self.label
                                ):
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                            else:
                                if (
                                    jl["functionality"] == self.functionality
                                    and jl["target"] == self.target
                                ):
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                        else:
                            if self.label is not None:
                                if (
                                    jl["functionality"] == self.functionality
                                    and jl["answer"] == self.label
                                ):
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                            else:
                                if jl["functionality"] == self.functionality:
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                    else:
                        if self.target is not None:
                            if self.label is not None:
                                if (
                                    jl["target"] == self.target
                                    and jl["answer"] == self.label
                                ):
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                            else:
                                if jl["target"] == self.target:
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                        else:
                            if self.label is not None:
                                if jl["answer"] == self.label:
                                    tmp.write(json.dumps(tmp_jl) + "\n")
                            else:
                                tmp.write(json.dumps(tmp_jl) + "\n")
                tmp.close()
                response = self.s3_client.upload_file(
                    tmp.name, self.s3_bucket, self._get_data_s3_path()
                )
                os.remove(tmp.name)
                if response:
                    logger.info(response)
        except Exception as ex:
            logger.exception(f"Failed to load {self.name} to S3 due to {ex}.")
            return False
        else:
            return True

    def label_field_converter(self, example):
        return {
            "id": example["uid"],
            "answer": example["label"],
            "tags": example.get("tags", []),
        }


class HateCheckFull(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck")


class LabelHate(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-l-hate", label="hate")


class LabelNotHate(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-l-nothate", label="nothate")


class FunctionalityTargetGroupNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-target-group-nh", functionality="target_group_nh"
        )


class FunctionalitySpellSpaceDelH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-spell-space-del-h", functionality="spell_space_del_h"
        )


class FunctionalitySlurReclaimedNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-slur-reclaimed-nh", functionality="slur_reclaimed_nh"
        )


class FunctionalitySlurHomonymNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-slur-homonym-nh", functionality="slur_homonym_nh"
        )


class FunctionalityThreatNormH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-threat-norm-h", functionality="threat_norm_h"
        )


class FunctionalityDerogImplH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-derog-impl-h", functionality="derog_impl_h")


class FunctionalityTargetObjNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-target-obj-nh", functionality="target_obj_nh"
        )


class FunctionalityCounterQuoteNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-counter-quote-nh", functionality="counter_quote_nh"
        )


class FunctionalityProfanityNh(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-profanity-nh", functionality="profanity_nh")


class FunctionalityIdentPosNh(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-ident-pos-nh", functionality="ident_pos_nh")


class FunctionalityNegatePosH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-negate-pos-h", functionality="negate_pos_h")


class FunctionalityNegateNegNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-negate-neg-nh", functionality="negate_neg_nh"
        )


class FunctionalityPhraseQuestionH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-phrase-question-h", functionality="phrase_question_h"
        )


class FunctionalityIdentNeutralNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-ident-neutral-nh", functionality="ident_neutral_nh"
        )


class FunctionalityProfanityH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-profanity-h", functionality="profanity_h")


class FunctionalityDerogNegEmoteH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-derog-neg-emote-h", functionality="derog_neg_emote_h"
        )


class FunctionalityPhraseOpinionH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-phrase-opinion-h", functionality="phrase_opinion_h"
        )


class FunctionalitySpellSpaceAddH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-spell-space-add-h", functionality="spell_space_add_h"
        )


class FunctionalitySpellLeetH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-spell-leet-h", functionality="spell_leet_h")


class FunctionalityDerogDehumH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-derog-dehum-h", functionality="derog_dehum_h"
        )


class FunctionalityThreatDirH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-threat-dir-h", functionality="threat_dir_h")


class FunctionalitySpellCharDelH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-spell-char-del-h", functionality="spell_char_del_h"
        )


class FunctionalityCounterRefNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-counter-ref-nh", functionality="counter_ref_nh"
        )


class FunctionalityTargetIndivNh(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-target-indiv-nh", functionality="target_indiv_nh"
        )


class FunctionalitySpellCharSwapH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-spell-char-swap-h", functionality="spell_char_swap_h"
        )


class FunctionalityDerogNegAttribH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-derog-neg-attrib-h", functionality="derog_neg_attrib_h"
        )


class FunctionalitySlurH(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-f-slur-h", functionality="slur_h")


class FunctionalityRefSubsSentH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-ref-subs-sent-h", functionality="ref_subs_sent_h"
        )


class FunctionalityRefSubsClauseH(HateCheck):
    def __init__(self):
        super().__init__(
            name="hatecheck-f-ref-subs-clause-h", functionality="ref_subs_clause_h"
        )


class TargetNone(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-none", target="")


class TargetBlackPeople(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-black-people", target="black people")


class TargetTransPeople(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-trans-people", target="trans people")


class TargetDisabledPeople(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-disabled-people", target="disabled people")


class TargetImmigrants(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-immigrants", target="immigrants")


class TargetGayPeople(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-gay-people", target="gay people")


class TargetWomen(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-women", target="women")


class TargetMuslims(HateCheck):
    def __init__(self):
        super().__init__(name="hatecheck-t-Muslims", target="Muslims")
