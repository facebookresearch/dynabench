# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add model AWS information
"""

from yoyo import step


__depends__ = {
    "20201208_add-tag-to-examples-and-contexts",
    "20201208_add_metadata_json_to_users",
    "20201215_01_Bb0Qw-add-advqa",
    "20210105_populate-total-verified-not-correct-fooled-column",
}

steps = [
    step(
        "ALTER TABLE models ADD COLUMN upload_timestamp BIGINT, ADD COLUMN s3_uri TEXT, \
         ADD COLUMN endpoint_url TEXT, ADD COLUMN deployment_status \
         ENUM('uploaded', 'processing', 'deployed', 'failed', 'unknown')",
        "ALTER TABLE models DROP COLUMN upload_timestamp, \
         DROP COLUMN s3_uri, DROP COLUMN endpoint_url, \
         DROP COLUMN deployment_status",
    )
]
