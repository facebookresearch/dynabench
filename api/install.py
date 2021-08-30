#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os


if __name__ == "__main__":
    if not os.path.exists("common/config.py"):
        print("Config does not exist yet, let's create it.")
        print("NOTE: Use absolute paths where necessary!")

        example_config_str = open("common/config.py.example").read()
        exec(example_config_str)

        required_fields = [
            "db_name",
            "db_user",
            "db_password",
            "ssl_cert_file_path",
            "ssl_org_pem_file_path",
        ]
        for field in required_fields:
            tmp = input(f"Please enter your {field}: ")
            config[field] = tmp

        with open("common/config.py", "w") as fw:
            fw.write("config = " + json.dumps(config, indent=4, sort_keys=True))
            print("Wrote config to common/config.py - feel free to edit")
    else:
        print("Config exists.")

    from common.migrator import first_time_migrations

    first_time_migrations()
