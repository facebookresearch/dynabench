# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all unpublished models from sagemaker
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL}
import argparse
import sys

import boto3

from models.model import ModelModel


sys.path.remove("../evaluation")  # noqa
sys.path.append("../builder")  # noqa

from utils.deployer import ModelDeployer  # # noqa isort:skip
from build_config import build_config  # noqa isort:skip


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--region",
        type=str,
        default="us-west-1",
        help=("Region to use when creating AWS session."),
    )

    # You cannot use `test_run` and `real_run` at the same time
    feature_parser = parser.add_mutually_exclusive_group(required=False)
    feature_parser.add_argument("--test_run", dest="test_run", action="store_true")
    feature_parser.add_argument("--real_run", dest="test_run", action="store_false")
    parser.set_defaults(test_run=True)
    args = parser.parse_args()

    return args


def main():
    args = parse_args()
    print(args)
    m = ModelModel()

    if not args.test_run:
        ops = input(
            f"You've chosen to actually delete prod endpoints "
            "(via flag `--real_run`),"
            " are you sure? [y/n]"
        )
        if ops.lower() not in ("y", "yes"):
            print(f"Aborting takedown script")
            exit(1)

    # Parse the DONT_TOUCH_MODELS
    endpoints_name_not_touch = None
    with open("cron/DONT_TOUCH_ENDPOINTS.txt") as f:
        endpoints_name_not_touch = [str(t) for t in f.readlines()[0].split(",")]

    # Make sure user is ok with current list of models not to touch
    ops = input(
        "You've chosen not to touch endpoints with names: "
        + ", ".join(endpoints_name_not_touch)
        + "Please make sure any additional endpoints you do not want delete are "
        "added in cron/DONT_TOUCH_ENDPOINTS.txt. Continue? [y/n]"
    )
    if ops.lower() not in ("y", "yes"):
        print(f"Aborting takedown script")
        exit(1)

    session = boto3.Session(
        aws_access_key_id=build_config["aws_access_key_id"],
        aws_secret_access_key=build_config["aws_secret_access_key"],
        region_name=args.region,
    )

    sm = session.client("sagemaker")

    # Retrieve all model endpoints
    endpoint_response = sm.list_endpoints(
        SortBy="Name",
        SortOrder="Descending",
        MaxResults=100,
    )

    endpoints = endpoint_response["Endpoints"]
    while "NextToken" in endpoint_response:
        next_token = endpoint_response["NextToken"]
        endpoint_response = sm.list_endpoints(
            SortBy="Name", SortOrder="Descending", MaxResults=100, NextToken=next_token
        )

        endpoints += endpoint_response["Endpoints"]

    print(f"Total num of endpoints: {len(endpoints)}")

    # Remove all DONT_TOUCH_ENDPOINTS from consideration
    final_endpoints = []
    for ep in endpoints:
        ep_name = ep["EndpointName"]
        if len(endpoints_name_not_touch) <= 0 or (
            not any(
                ep_name in bad_endpoint for bad_endpoint in endpoints_name_not_touch
            )
        ):
            final_endpoints.append(ep)

    print(
        "Total num of endpoints after removing "
        f"DONT_TOUCH_ENDPOINTS: {len(final_endpoints)}"
    )
    for ep in final_endpoints:
        ep_name = ep["EndpointName"]

        models_with_endpoint_name = m.getByEndpointName(endpoint_name=ep_name)

        # If the endpoints do not correspond to any model in the DB
        if len(models_with_endpoint_name) > 0:  # TODO change to < 1

            # If not `test_run`, do the actual deletion
            if not args.test_run:
                print(f"Found no model for endpoint: {ep_name}, deleting endpoint...")

                # Delete the endpoint
                sm.delete_endpoint(EndpointName=ep_name)

                # Delete sagemaker model
                model_response = sm.list_models(
                    SortBy="Name",
                    SortOrder="Descending",
                    MaxResults=10,
                    NameContains=ep_name,
                )
                sm_models = model_response["Models"]
                for sm_model in sm_models:
                    if sm_model["ModelName"] == ep_name:
                        print(f"- Deleting the model {ep_name}")
                        sm.delete_model(ModelName=ep_name)

                # Delete endpoint config
                config_response = sm.list_endpoint_configs(
                    SortBy="Name",
                    SortOrder="Descending",
                    MaxResults=10,
                    NameContains=ep_name,
                )
                endpoint_configs = config_response["EndpointConfigs"]
                for endpoint_config in endpoint_configs:
                    if endpoint_config["EndpointConfigName"] == ep_name:
                        print(f"- Deleting the endpoint config {ep_name}")
                        sm.delete_endpoint_config(EndpointConfigName=ep_name)

            else:
                print(f"Found no model for endpoint: {ep_name}, would delete endpoint")


if __name__ == "__main__":
    main()
