# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all unused model endpoints
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL}
import sys
import traceback
from datetime import datetime, timedelta

import boto3

from build_config import build_config
from models.model import DeploymentStatusEnum, ModelModel


sys.path.remove("../evaluation")  # noqa
sys.path.append("../builder")  # noqa

from utils.deployer import ModelDeployer  # # noqa isort:skip


def main():
    m = ModelModel()

    # Get all non in-the-loop models
    models_not_in_loop = m.getByInTheLoopStatus(in_the_loop=False)

    endpoint_last_used_cutoff = 1

    for model in models_not_in_loop:
        if (
            model.deployment_status == DeploymentStatusEnum.deployed
            or model.deployment_status == DeploymentStatusEnum.created
        ):
            try:
                deployer = ModelDeployer(model)
                region = model.task.aws_region
                session = boto3.Session(
                    aws_access_key_id=build_config["aws_access_key_id"],
                    aws_secret_access_key=build_config["aws_secret_access_key"],
                    region_name=region,
                )
                sm = deployer.env["sagemaker_client"]
                cw = session.client("cloudwatch")

                # Check if the endpoint has been used in the last hour
                endpoint_response = deployer.env["sagemaker_client"].list_endpoints(
                    SortBy="Name",
                    NameContains=model.endpoint_name,
                    StatusEquals="InService",
                )

                if len(endpoint_response["Endpoints"]) != 1:
                    print("Error! Should only be removing one endpoint per iteration")
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

                    # Delete endpoint
                    print(
                        f"Removing model endpoint for: {model.name}"
                        f" at endpoint {model.endpoint_name}"
                    )
                    sm.delete_endpoint(EndpointName=model.endpoint_name)

                    model_response = sm.list_models(
                        SortBy="Name",
                        NameContains=model.endpoint_name,
                    )

                    assert len(model_response["Models"]) == 1
                    sm.delete_model(ModelName=model.endpoint_name)

                    config_response = sm.list_endpoint_configs(
                        SortBy="Name",
                        NameContains=model.endpoint_name,
                    )
                    assert len(config_response["EndpointConfigs"]) == 1
                    sm.delete_endpoint_config(EndpointConfigName=model.endpoint_name)

                    # Update status to show that model endpoint was deleted
                    m.update(
                        model.id,
                        deployment_status=DeploymentStatusEnum.takendownnonactive,
                    )

            except Exception as e:
                print(f"Ran into exception when taking down model {model.name}")
                print(traceback.format_exc())
                print(e)


if __name__ == "__main__":
    main()
