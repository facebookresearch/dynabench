# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all:
#
# (1) non in the loop models that have not been
# used in some amount of time (defined by endpoint_last_used_cutoff flag)
#
# (2) all endpoints not associated with any model in the DB
#
# By "remove" we mean taking down:
# (1) the endpoint,
# (2) the endpoint config
# (3) the sagemaker model
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL, "endpoint_only":True}
import argparse
import sys
import traceback
from datetime import datetime, timedelta

import boto3

from models.model import DeploymentStatusEnum, ModelModel


sys.path.remove("../evaluation")  # noqa
sys.path.append("../builder")  # noqa

from utils.deployer import ModelDeployer  # noqa isort:skip
from build_config import build_config  # noqa isort:skip


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--region",
        type=str,
        default="us-west-1",
        help=("Region to use when creating AWS session."),
    )
    parser.add_argument(
        "--endpoint_last_used_cutoff",
        type=int,
        default=72,
        help=(
            "One of the functions of this script is to delete models whose"
            " been used in a while. How long this cutoff is defined by"
            " `endpoint_last_used_cutoff` (in hours). For example, setting"
            " this flag to 1 will delete all endpoints that have not been"
            " in the last hour."
        ),
    )

    # You cannot use `test_run` and `real_run` at the same time
    feature_parser = parser.add_mutually_exclusive_group(required=False)
    feature_parser.add_argument("--test_run", dest="test_run", action="store_true")
    feature_parser.add_argument("--real_run", dest="test_run", action="store_false")
    parser.set_defaults(test_run=True)
    args = parser.parse_args()

    return args


def dont_touch_endpoint(endpoints_name_not_touch, ep_name):
    return len(endpoints_name_not_touch) > 0 and (
        any(ep_name in bad_endpoint for bad_endpoint in endpoints_name_not_touch)
    )


def delete_endpoint(sagemaker_client, endpoint_name):
    print(f"Removing model endpoint at: {endpoint_name}")

    # Delete endpoint
    sagemaker_client.delete_endpoint(EndpointName=endpoint_name)

    # Delete Sagemaker model
    model_response = sagemaker_client.list_models(
        SortBy="Name",
        NameContains=endpoint_name,
    )

    assert len(model_response["Models"]) == 1
    sagemaker_client.delete_model(ModelName=endpoint_name)

    # Delete Endpoint Config
    config_response = sagemaker_client.list_endpoint_configs(
        SortBy="Name",
        NameContains=endpoint_name,
    )
    assert len(config_response["EndpointConfigs"]) == 1
    sagemaker_client.delete_endpoint_config(EndpointConfigName=endpoint_name)


def main():
    args = parse_args()

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
        endpoints_name_not_touch = [t.strip() for t in f.readlines()]

    ops = input(
        "You've chosen not to touch endpoints with names: "
        + ", ".join(endpoints_name_not_touch)
        + "\nPlease make sure any additional endpoints you do not want delete are "
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
    cw = session.client("cloudwatch")
    endpoint_last_used_cutoff = args.endpoint_last_used_cutoff
    endpoints_deleted = []

    m = ModelModel()

    # Get all non in-the-loop models
    models_not_in_loop = m.getByInTheLoopStatus(in_the_loop=False)

    for model in models_not_in_loop:
        if (
            model.deployment_status == DeploymentStatusEnum.deployed
            or model.deployment_status == DeploymentStatusEnum.created
        ):
            try:
                # Check if the endpoint has been used in the last hour
                endpoint_response = sm.list_endpoints(
                    SortBy="Name",
                    SortOrder="Descending",
                    MaxResults=10,
                    NameContains=model.endpoint_name,
                    StatusEquals="InService",
                )

                if len(endpoint_response["Endpoints"]) != 1:
                    print(
                        "Error! Should be considering exactly one endpoint for a model"
                    )
                    print(
                        f"Skipping model: {model.name} at"
                        f"endpoint {model.endpoint_name}"
                    )
                    continue

                ep_to_analyze = endpoint_response["Endpoints"][0]

                ep_describe = sm.describe_endpoint(
                    EndpointName=ep_to_analyze["EndpointName"]
                )

                metric_response = cw.get_metric_statistics(
                    Namespace="AWS/SageMaker",
                    MetricName="Invocations",
                    Dimensions=[
                        {
                            "Name": "EndpointName",
                            "Value": ep_to_analyze["EndpointName"],
                        },
                        {
                            "Name": "VariantName",
                            "Value": ep_describe["ProductionVariants"][0][
                                "VariantName"
                            ],
                        },
                    ],
                    StartTime=datetime.utcnow()
                    - timedelta(hours=endpoint_last_used_cutoff),
                    EndTime=datetime.utcnow(),
                    Period=int(endpoint_last_used_cutoff * 60 * 60),
                    Statistics=["Sum"],
                    Unit="None",
                )

                if (
                    len(metric_response["Datapoints"]) <= 0
                    or metric_response["Datapoints"][0]["Sum"] <= 0.0
                ):

                    if dont_touch_endpoint(
                        endpoints_name_not_touch, model.endpoint_name
                    ):
                        continue

                    endpoints_deleted.append(model.endpoint_name)
                    if args.test_run:
                        continue

                    delete_endpoint(sm, model.endpoint_name)

                    # Update status to show that model endpoint was deleted
                    m.update(
                        model.id,
                        deployment_status=DeploymentStatusEnum.takendownnonactive,
                    )

            except Exception as e:
                print(f"Ran into exception when analyzing model {model.name}")
                print(traceback.format_exc())
                print(e)

    # Get all endpoints not associated with any model
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

    for ep in endpoints:
        ep_name = ep["EndpointName"]

        models_with_endpoint_name = m.getByEndpointName(endpoint_name=ep_name)

        # If the endpoints do not correspond to any model in the DB
        if len(models_with_endpoint_name) < 1:

            if dont_touch_endpoint(endpoints_name_not_touch, ep_name):
                continue

            endpoints_deleted.append(ep_name)
            if args.test_run:
                continue
            delete_endpoint(sm, ep_name)

            # We don't update any model status here, because by definition there is no
            # model in the DB to associate with this endpoint

    print("Endpoints deleted:")
    print(endpoints_deleted)
    print(f"# Endpoints deleted is: {len(endpoints_deleted)}")


if __name__ == "__main__":
    main()
