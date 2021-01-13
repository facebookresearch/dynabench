# Copyright (c) Facebook, Inc. and its affiliates.

import json
import os
import sys

import httplib2


# This was needed to import the models package.
sys.path.append("..")

baseUrl = "http://images.cocodataset.org/annotations"

imageUrl = "https://s3.us-east-1.amazonaws.com/images.cocodataset.org/{}/{}.jpg"

h = httplib2.Http()

datasets = {
    "image_info_test2015": ["image_info_test2015"],
    "annotations_trainval2014": [
        # Could be any of the jsons in the zip.
        "person_keypoints_train2014",
        "person_keypoints_val2014",
    ],
}


def getImagesFromFile(fileName):
    path = f"annotations/{fileName}.json"
    with open(path) as jsonFile:
        anns = json.load(jsonFile)
        return anns["images"]


def getUrlById(id):
    possibleUrls = [imageUrl.format("train2017", id), imageUrl.format("val2017", id)]
    for url in possibleUrls:
        if isValidUrl(url):
            return url
    return None


def isValidUrl(url):
    resp = h.request(url, "HEAD")
    return int(resp[0]["status"]) < 400


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

            setName = f.split("_")[-1]
            setType = setName[:-4]
            images = getImagesFromFile(f)
            data = []
            # for image in images:
            print(setName)
            for i in range(5):
                image = images[i]
                id = image["file_name"].split("_")[-1].split(".")[0]
                url = (
                    getUrlById(id)
                    if setType == "val"
                    else imageUrl.format(f"{setType}2017", id)
                )
                if url is not None:
                    data.append(
                        {
                            "context": url,
                            "metadata_json": json.dumps(
                                {
                                    "id": id,
                                    "file_name": image["file_name"],
                                    "date_captured": image["date_captured"],
                                }
                            ),
                        }
                    )
                print(i)

            for context in data:
                url = context["context"]
                md = context["metadata_json"]
                c = Context(round=round, context=url, metadata_json=md, tag=setName)
                dbs.add(c)
                dbs.flush()

            dbs.commit()


if __name__ == "__main__":
    main()
