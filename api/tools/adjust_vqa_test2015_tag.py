# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# flake8: noqa

import json  # isort:skip
import os  # isort:skip
import sys  # isort:skip
import sqlalchemy as db
from sqlalchemy import JSON

from common.config import config


sys.path.append("..")  # isort:skip

from models.context import Context  # isort:skip
from models.round import RoundModel  # isort:skip
from models.task import TaskModel  # isort:skip


def update_tag(filename, dbs, assert_length, old_tag, new_tag):
    anns = None
    with open(filename) as jsonFile:
        anns = json.load(jsonFile)

    images_list = []
    for ann in anns["questions"]:
        images_list.append(ann["image_id"])

    unique_images_list = list(set(images_list))
    print(f"{new_tag} image size: {len(unique_images_list)}")
    assert (
        len(unique_images_list) == assert_length
    ), f"{new_tag} has to be of length {assert_length}"
    results = (
        dbs.query(Context)
        .filter(db.cast(Context.metadata_json, JSON)["id"].in_(unique_images_list))
        .filter(Context.tag == old_tag)  # 39937 -> 36807 (on dev db)
    )
    cids = [c.id for c in results.all()]
    assert len(cids) == len(set(cids))
    print(f"final cids length to be actioned on: {len(cids)}")
    print(f"updating {new_tag}...")
    updates = (
        dbs.query(Context)
        .filter(Context.id.in_(cids))
        .update({"tag": new_tag}, synchronize_session="fetch")
    )
    dbs.commit()
    print("done.")


def main():
    filename_test_dev = "v2_OpenEnded_mscoco_test-dev2015_questions.json"
    filename_test = "v2_OpenEnded_mscoco_test2015_questions.json"
    zip_file = "v2_Questions_Test_mscoco.zip"
    test2015_url = f"https://s3.amazonaws.com/cvmlp/vqa/mscoco/vqa/{zip_file}"
    if not os.path.exists(filename_test_dev):
        os.system(f"wget {test2015_url}")
        os.system(f"unzip {zip_file}")

    rid = 1
    tm = TaskModel()
    task = tm.getByShortName("VQA")
    rm = RoundModel()
    round = rm.getByTidAndRid(task.id, rid)

    dbs = tm.dbs
    update_tag(filename_test_dev, dbs, 36807, "test2015", "test-dev2015")

    # commented out because already correct.
    # update_tag(
    #     filename_test,
    #     dbs,
    #     81434,
    #     "test2015"
    #     "test2015",
    # )


if __name__ == "__main__":
    main()
