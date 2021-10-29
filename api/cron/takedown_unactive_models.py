# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all unactive models from sagemaker
# (based on the `last_used`)
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL}
import sys
import traceback

from models.model import DeploymentStatusEnum, ModelModel


sys.path.remove("../evaluation")  # noqa
sys.path.append("../builder")  # noqa

from utils.deployer import ModelDeployer  # # noqa isort:skip


def main():
    m = ModelModel()
    unactive_models = m.getByNotLastUsedWithinWeek()
    for model in unactive_models:
        if model.deployment_status == DeploymentStatusEnum.deployed:
            print(f"Removing model: {model.name} at endpoint {model.endpoint_name}")
            try:
                deployer = ModelDeployer(model)
                deployer.delete_existing_endpoints(
                    sort_order="Descending", max_results=10
                )

                # Update the model to have status `taken_down`
                m.update(
                    model.id, deployment_status=DeploymentStatusEnum.takendownnonactive
                )

                # Note that we keep the model on s3, so that we can
                # redeploy the model whenever we want

            except Exception as e:
                print(f"Ran into exception when taking down model {model.name}")
                print(traceback.format_exc())
                print(e)


if __name__ == "__main__":
    main()
