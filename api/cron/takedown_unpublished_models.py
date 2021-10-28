# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all unpublished models from sagemaker
# These models can be redeployed by sending a message to the build server
import sys
import traceback

from models.model import DeploymentStatusEnum, ModelModel


sys.path.remove("../evaluation")  # noqa
sys.path.append("../builder")  # noqa

from utils.deployer import ModelDeployer  # # noqa isort:skip


def delete_existing_endpoints(model_deployer):
    # note: this is the exact same as ModelDeployer.delete_existing_endpoints()
    # but for some reason, adding SortOrder="Ascending" causes the API
    # call to return no results (TODO: figure out why)
    endpoint_response = model_deployer.env["sagemaker_client"].list_endpoints(
        SortBy="Name",
        MaxResults=100,
        NameContains=model_deployer.endpoint_name,
    )

    endpoints = endpoint_response["Endpoints"]
    for endpoint in endpoints:
        if endpoint["EndpointName"] == model_deployer.endpoint_name:
            print(f"- Deleting the endpoint {model_deployer.endpoint_name:}")
            model_deployer.env["sagemaker_client"].delete_endpoint(
                EndpointName=model_deployer.endpoint_name
            )

    # remove sagemaker model
    model_response = model_deployer.env["sagemaker_client"].list_models(
        SortBy="Name",
        MaxResults=100,
        NameContains=model_deployer.endpoint_name,
    )
    sm_models = model_response["Models"]
    for sm_model in sm_models:
        if sm_model["ModelName"] == model_deployer.endpoint_name:
            print(f"- Deleting the model {model_deployer.endpoint_name:}")
            model_deployer.env["sagemaker_client"].delete_model(
                ModelName=model_deployer.endpoint_name
            )

    # remove config
    config_response = model_deployer.env["sagemaker_client"].list_endpoint_configs(
        SortBy="Name",
        MaxResults=100,
        NameContains=model_deployer.endpoint_name,
    )
    endpoint_configs = config_response["EndpointConfigs"]
    for endpoint_config in endpoint_configs:
        if endpoint_config["EndpointConfigName"] == model_deployer.endpoint_name:
            print(f"- Deleting the endpoint config {model_deployer.endpoint_name:}")
            model_deployer.env["sagemaker_client"].delete_endpoint_config(
                EndpointConfigName=model_deployer.endpoint_name
            )
    try:
        response = model_deployer.env["ecr_client"].delete_repository(
            repositoryName=model_deployer.repository_name, force=True
        )
        print(f"- Deleting the docker repository {model_deployer.repository_name:}")
    except model_deployer.env["ecr_client"].exceptions.RepositoryNotFoundException:
        print(
            f"""Repository {model_deployer.repository_name} not found.
            If deploying, this will be created"""
        )
    else:
        if response:
            print(f"Response from deleting ECR repository {response}")


m = ModelModel()
unpublished_models = m.getByPublishStatus(publish_status=False)

for model in unpublished_models:
    if model.name == "bertstyleqa":  # TODO: remove this
        if model.deployment_status == DeploymentStatusEnum.deployed:
            print(f"Removing model: {model.name} at endpoint {model.endpoint_name}")
            try:
                # Take down the model endpoint
                deployer = ModelDeployer(model)

                # This should delete the:
                # 1) model endpoint
                # 2) sagemaker model
                # 3) endpoint config
                # 4) ecr repository (docker image)
                delete_existing_endpoints(deployer)

                # Update the model to have status `taken_down`
                m.update(model.id, deployment_status=DeploymentStatusEnum.takendown)

                # Note that we keep the model on s3, so that we can
                # redeploy the model whenever we want

            except Exception as e:
                print(f"Ran into exception when taking down model {model.name}")
                print(traceback.format_exc())
                print(e)
