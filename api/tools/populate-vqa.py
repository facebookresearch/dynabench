# Copyright (c) Facebook, Inc. and its affiliates.

import os
import json
import sys

# This was needed to import the models package.
sys.path.append('/Users/albertolm9115/dynabench/api')

from models.context import Context
from models.round import Round, RoundModel
from models.task import TaskModel

# if not os.path.exists("image_info_test2017.zip"):
#     os.system("wget http://images.cocodataset.org/annotations/image_info_test2017.zip")
# if not os.path.exists("annotations"):
#     os.system("unzip image_info_test2017.zip")

# with open('annotations/image_info_test2017.json') as json_file:
#     anns = json.load(json_file)
#     print(f'File containing {len(anns["images"])}')

# data = []
# for image in anns["images"]:
#     data.append(
#         {
#             "contexts": image["coco_url"],
#             "metadata_json": json.dumps(
#                 {
#                     "id": image["id"],
#                     "file_name": image["file_name"],
#                     "height": image["height"],
#                     "width": image["width"],
#                     "date_captured": image["date_captured"]
#                 }
#             ),
#         }
#     )

rid = 1

tm = TaskModel()
rm = RoundModel()
dbs = tm.dbs

task = tm.getByShortName("VQA")
# round = rm.getByTidAndRid(task.id, rid)
print(rm.getByTid(task.id))

# for context in data:
#     print(task.id, rid, context)
#     c = Context(
#         round=round, context=context["context"], metadata_json=context["metadata_json"]
#     )
#     print(c)
#     dbs.add(c)
#     dbs.flush()

# dbs.commit()
