# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys
import tempfile

from datasets.common import logger
from utils import helpers

from .base import MTBase


FLORES101_SMALL1_LANGS = [
    "hr_HR",
    "hu_HU",
    "et_EE",  # "sr_SR",   not complete yet
    "mk_MK",
    "en_XX",
]

FLORES101_SMALL2_LANGS = ["su_ID", "jv_ID", "id_ID", "ms_MY", "tl_XX", "ta_IN", "en_XX"]
# incomplete
FLORES101_FULL_LANGS = [
    "af_ZA",
    "am_ET",
    "as_IN",
    "bg_BG",
    "bn_IN",
    "bs_BA",
    "cs_CZ",
    "cx_PH",
    "da_DK",
    "de_DE",
    "en_XX",
    "et_EE",
    "fa_IR",
    "ff_NG",
    "fr_FR",
    "gu_IN",
    "ha_NG",
    "he_IL",
    "hi_IN",
    "hr_HR",
    "hu_HU",
    "hy_AM",
    "id_ID",
    "ig_NG",
    "it_IT",
    "jv_ID",
    "km_KH",
    "kn_IN",
    "ko_KR",
    "ku_KR",
    "lg_UG",
    "lo_LA",
    "lt_LT",
    "mg_MG",
    "mk_MK",
    "ml_IN",
    "mn_MN",
    "mr_IN",
    "ms_MY",
    "my_MM",
    "ne_NP",
    "nl_XX",
    "om_KE",
    "or_IN",
    "pa_IN",
    "ps_AF",
    "si_LK",
    "so_SO",
    "su_ID",
    "sv_SE",
    "sw_KE",
    "ta_IN",
    "te_IN",
    "tl_XX",
    "tn_BW",
    "tr_TR",
    "ur_PK",
    "wo_SN",
    "xh_ZA",
    "yo_NG",
    "zu_ZA",
]


class Flores101Base(MTBase):
    def __init__(self, task, name, round_id, local_path, partition, languages):
        self.local_path = local_path
        self.partition = partition
        self.languages = languages[1:10]
        super().__init__(task=task, name=name, round_id=round_id)

    def _get_data_s3_path(self, perturb_prefix=None):
        return helpers.get_data_s3_path(
            "flores/" + self.task, self.filename, perturb_prefix
        )

    def load(self):
        try:
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for lang1 in self.languages:
                    for lang2 in self.languages:
                        if lang1 == lang2:
                            continue
                        row = 0
                        for line1, line2 in zip(
                            open(
                                f"{self.local_path}/{lang1}.{self.partition}"
                            ).readlines(),
                            open(
                                f"{self.local_path}/{lang2}.{self.partition}"
                            ).readlines(),
                        ):
                            tmp_jl = {
                                "uid": f"{row}-{lang1}-{lang2}-{self.partition}",
                                "sourceLanguage": lang1,
                                "targetLanguage": lang2,
                                "sourceText": line1.strip(),
                                "targetText": line2.strip(),
                            }
                            row += 1
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
            "answer": example["targetText"],
            "tags": [
                "src:" + example["sourceLanguage"],
                "tgt:" + example["targetLanguage"],
            ],
        }


class Flores101FullDev(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_full",
            name="flores101-full-dev",
            round_id=1,
            local_path=local_path,
            partition="dev",
            languages=FLORES101_FULL_LANGS,
        )


class Flores101FullDevTest(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_full",
            name="flores101-full-devtest",
            round_id=1,
            local_path=local_path,
            partition="devtest",
            languages=FLORES101_FULL_LANGS,
        )


class Flores101FullTest(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_full",
            name="flores101-full-test",
            round_id=1,
            local_path=local_path,
            partition="test",
            languages=FLORES101_FULL_LANGS,
        )


class Flores101Small1Dev(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small1",
            name="flores101-small1-dev",
            round_id=1,
            local_path=local_path,
            partition="dev",
            languages=FLORES101_SMALL1_LANGS,
        )


class Flores101Small1DevTest(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small1",
            name="flores101-small1-devtest",
            round_id=1,
            local_path=local_path,
            partition="devtest",
            languages=FLORES101_SMALL1_LANGS,
        )


class Flores101Small1Test(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small1",
            name="flores101-small1-test",
            round_id=1,
            local_path=local_path,
            partition="test",
            languages=FLORES101_SMALL1_LANGS,
        )


class Flores101Small2Dev(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small2",
            name="flores101-small2-dev",
            round_id=1,
            local_path=local_path,
            partition="dev",
            languages=FLORES101_SMALL2_LANGS,
        )


class Flores101Small2DevTest(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small2",
            name="flores101-small2-devtest",
            round_id=1,
            local_path=local_path,
            partition="devtest",
            languages=FLORES101_SMALL2_LANGS,
        )


class Flores101Small2Test(Flores101Base):
    def __init__(self):
        rootpath = os.path.dirname(sys.path[0])
        local_path = os.path.join(rootpath, "evaluation/data", "mt/flores101")
        super().__init__(
            task="flores_small2",
            name="flores101-small2-test",
            round_id=1,
            local_path=local_path,
            partition="test",
            languages=FLORES101_SMALL2_LANGS,
        )
