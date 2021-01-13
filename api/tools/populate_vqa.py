# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys


# This was needed to import the models package.
sys.path.append("..")


baseUrl = "http://images.cocodataset.org/annotations"

datasets = {
    "annotations_trainval2014": [
        # Could be any of the jsons in the zip.
        "person_keypoints_train2014",
        "person_keypoints_val2014",
    ],
    "image_info_test2015": ["image_info_test2015"],
}


def getSetName(fileName):
    if fileName.find("_") == -1:
        raise Exception("Invalid input.")
    return fileName.split("_")[-1]


def getImagesFromFile(fileName):
    path = f"annotations/{fileName}.json"
    if not os.path.exists(path):
        raise Exception(f"Invalid path. File {fileName} does not exist.")
    with open(path) as jsonFile:
        anns = json.load(jsonFile)
        return anns["images"]


def getImageUrl(setName, id):
    return (
        f"https://s3.us-east-1.amazonaws.com/images.cocodataset.org/{setName}/{id}.jpg"
    )


def main():

    from models.context import Context
    from models.round import RoundModel
    from models.task import TaskModel

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

            setName = getSetName(f)
            images = getImagesFromFile(f)

            data = []
            for image in images:
                data.append(
                    {
                        "context": getImageUrl(setName, image["id"]),
                        "metadata_json": json.dumps(
                            {
                                "id": image["id"],
                                "file_name": image["file_name"],
                                "height": image["height"],
                                "width": image["width"],
                                "date_captured": image["date_captured"],
                            }
                        ),
                    }
                )

            # for context in data:
            print(setName)
            context = data[0]
            print(context)
            url = context["context"]
            md = context["metadata_json"]
            c = Context(round=round, context=url, metadata_json=md, tag=setName)
            dbs.add(c)
            dbs.flush()

            dbs.commit()


if __name__ == "__main__":
    main()
