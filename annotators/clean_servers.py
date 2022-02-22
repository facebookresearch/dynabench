# Copyright (c) Facebook, Inc. and its affiliates.

import sys

from mephisto.abstractions.databases.local_database import LocalMephistoDB
from mephisto.abstractions.providers.mturk.mturk_utils import (
    expire_and_dispose_hits,
    get_outstanding_hits,
)


ONLY_PROCESS_RC = True


sys.path.append("./Mephisto")
db = LocalMephistoDB()
requester = db.find_requesters(requester_name=input("Enter requester name: "))[0]

client = requester._get_client(requester._requester_name)

print("Retrieving outstanding HITs (this can take a while)...")
outstanding_hit_types = get_outstanding_hits(client)
print(f"Outstanding HITs retrieved for {len(outstanding_hit_types)} HIT types")
print(f"There are a total of {sum([len(outstanding_hit_types[hit_type]) for hit_type in outstanding_hit_types])} outstanding HITs.")

response = None
process_all = False
for i, hit_type in enumerate(outstanding_hit_types):
    cur_title = outstanding_hit_types[hit_type][0]["Title"]
    print(f"HIT TITLE ({i+1}/{len(outstanding_hit_types)}): {cur_title}")

    if not process_all and not ONLY_PROCESS_RC:
        response = input(f"Do you want to expire the {len(outstanding_hit_types[hit_type])} outstanding HITs for HIT type: {hit_type}? (y/n/YALL): ")

    if ONLY_PROCESS_RC:
        if "Reading Comprehension" in cur_title:
            response = "y"
        else:
            response = "n"

    if response == 'YALL':
        process_all = True

    if process_all or response.lower() == 'y':
        print(f"Expiring and disposing {len(outstanding_hit_types[hit_type])} HITs for {hit_type}")
        try:
            expire_and_dispose_hits(client, outstanding_hit_types[hit_type])
        except Exception as e:
            print(f"Exception encountered: {e}")

    print('-'*5)
