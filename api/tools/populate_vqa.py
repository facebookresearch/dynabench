# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# flake8: noqa

import common.helpers as util


import os  # isort:skip
import sys  # isort:skip


sys.path.append("..")  # isort:skip

from models.context import Context  # isort:skip
from models.round import RoundModel  # isort:skip
from models.task import TaskModel  # isort:skip


def getImagesFromFile(fileName):
    path = f"annotations/{fileName}.json"
    with open(path) as jsonFile:
        anns = util.json_decode(jsonFile)
        return anns["images"]


def main():

    baseUrl = "http://images.cocodataset.org/annotations"

    imageUrl = "https://dl.fbaipublicfiles.com/dynabench/coco/{}/{}"

    datasets = {
        # Already run
        # "image_info_test2015": ["image_info_test2015"],
        # "annotations_trainval2014": [
        #     # Could be any of the jsons in the zip.
        #     "person_keypoints_train2014",
        #     "person_keypoints_val2014",
        # ],
        "annotations_trainval2017": ["person_keypoints_val2017"]
    }

    rid = 1
    tm = TaskModel()
    task = tm.getByShortName("VQA")
    rm = RoundModel()
    round = rm.getByTidAndRid(task.id, rid)

    # Connect to the task model database session
    dbs = tm.dbs

    for ds in datasets:

        if not os.path.exists(f"{ds}.zip"):
            os.system(f"wget {baseUrl}/{ds}.zip")
            os.system(f"unzip {ds}.zip")

        for f in datasets[ds]:

            setName = f.split("_")[-1]
            images = getImagesFromFile(f)
            data = []
            print(setName)
            for image in images:
                fileName = image["file_name"]
                url = imageUrl.format(setName, fileName)
                data.append(
                    {
                        "context": url,
                        "metadata_json": util.json_encode(
                            {"id": image["id"], "file_name": fileName}
                        ),
                    }
                )

            for context in data:
                url = context["context"]
                md = context["metadata_json"]
                c = Context(round=round, context=url, metadata_json=md, tag=setName)
                dbs.add(c)
                dbs.flush()

            dbs.commit()


if __name__ == "__main__":
    main()
