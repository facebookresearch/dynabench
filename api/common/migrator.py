# Copyright (c) Facebook, Inc. and its affiliates.

import os

from yoyo import get_backend, read_migrations

from common.config import config


def run_migrations():
    engine_url = "mysql://{}:{}@{}:3306/{}".format(
        config["db_user"], config["db_password"], config["db_host"], config["db_name"]
    )
    backend = get_backend(engine_url)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    migrations_path = os.path.abspath(os.path.join(current_dir, "..", "migrations"))
    migrations = read_migrations(migrations_path)

    with backend.lock():
        # Apply any outstanding migrations
        print(f"Running any outstanding migrations at path {migrations_path}")
        backend.apply_migrations(backend.to_apply(migrations))
