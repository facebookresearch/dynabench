# Copyright (c) Facebook, Inc. and its affiliates.

import os
import json
import sys

# This was needed to import the models package.
sys.path.append('/Users/albertolm9115/dynabench/api')

from models.context import Context
from models.round import Round, RoundModel
from models.task import TaskModel

base_url = "http://images.cocodataset.org/annotations"

datasets = {
                "annotations_trainval2014": ["person_keypoints_train2014", "person_keypoints_val2014"],
                "image_info_test2015": ["image_info_test2015"]
            }

rid = 1

tm = TaskModel()
rm = RoundModel()
dbs = tm.dbs

task = tm.getByShortName("VQA")
round = rm.getByTidAndRid(task.id, rid)

for ds in datasets:

    if not os.path.exists(f'{ds}.zip'):
        os.system(f'wget {base_url}/{ds}.zip')
        os.system(f'unzip {ds}.zip')

    for f in datasets[ds]:

        with open(f'annotations/{f}.json', 'r') as json_file:
            anns = json.load(json_file)

        set_name = f.split('_')[-1]
        data = []
        for image in anns["images"]:
            data.append(
                {
                    "contexts": f'https://s3.us-east-1.amazonaws.com/images.cocodataset.org/{set_name}/{image["id"]}.jpg',
                    "metadata_json": json.dumps(
                        {
                            "id": image["id"],
                            "file_name": image["file_name"],
                            "height": image["height"],
                            "width": image["width"],
                            "date_captured": image["date_captured"]
                        }
                    ),
                }
            )

        for context in data:
            c = Context(
                round=round, context=context["context"], metadata_json=context["metadata_json"]
            )
            dbs.add(c)
            dbs.flush()

        dbs.commit()
