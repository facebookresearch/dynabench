# Copyright (c) Facebook, Inc. and its affiliates.

"""
This is a script to automatically deploy the models in SageMaker for hs,
sentiment, qa and nli.
After execution an endpoint to access the model will be printed.
Before running this script, install the requirements.txt,
place create_torchscript.py and deploy_config.json files in the same directory,
place the secrets.json in the common folder.
"""
import json
import os
import shutil
import subprocess
import traceback
from os import listdir
from os.path import isfile, join

import boto3
import requests
import sagemaker
from sagemaker.model import Model
from sagemaker.predictor import Predictor  # RealTimePredictor

from common import TransformerUtils


def setup_env(sagemaker_role):
    """
    Sets the sagemaker environment required for deployment
    """
    session = boto3.Session()
    region = session.region_name
    account = boto3.client("sts").get_caller_identity().get("Account")
    client = boto3.client("sagemaker")

    sagemaker_session = sagemaker.Session(boto_session=session)
    role = sagemaker_role
    bucket_name = sagemaker_session.default_bucket()
    registry_name = "torchserve"
    prefix = "torchserve"

    return region, account, prefix, registry_name, role, bucket_name, client


def handle_existing_endpoints(client, sm_model_name, redeploy):
    """
    This checks if the sagemaker already contains an endpoint and
    a model with the generated name
    """
    response = client.list_endpoints(
        SortBy="Name",
        SortOrder="Ascending",
        MaxResults=100,
        StatusEquals="InService",
        NameContains=sm_model_name,
    )
    # print(f'Endpoints are {response}')
    skip_deployment = False
    endpoints = response["Endpoints"]
    for endpoint in endpoints:
        if endpoint["EndpointName"] == sm_model_name:
            if redeploy:
                print(f"Deleting the endpoint {sm_model_name:} to redeploy")
                client.delete_endpoint(EndpointName=sm_model_name)
            else:
                skip_deployment = True
                print(f"----- Endpoint with the name {sm_model_name} already exists")
                print(
                    "Set redeploy = true to redeploy the endpoint. "
                    + "Moving to the next model -----"
                )
                break

    if not skip_deployment:
        model_response = client.list_models(
            SortBy="Name",
            SortOrder="Ascending",
            MaxResults=100,
            NameContains=sm_model_name,
        )
        sm_models = model_response["Models"]
        for sm_model in sm_models:
            if sm_model["ModelName"] == sm_model_name:
                if redeploy:
                    print(f"Deleting the model {sm_model_name:} to redeploy")
                    model_response = client.delete_model(ModelName=sm_model_name)
                else:
                    skip_deployment = True
                    print(
                        f"----- Model with the name {sm_model_name} already exists,\
                    set redeploy = true to redeploy the endpoint. Moving to the \
                    next model -----------"
                    )

    if not skip_deployment:
        config_response = client.list_endpoint_configs(
            SortBy="Name",
            SortOrder="Ascending",
            MaxResults=100,
            NameContains=sm_model_name,
        )
        endpoint_configs = config_response["EndpointConfigs"]
        for endpoint_config in endpoint_configs:
            if endpoint_config["EndpointConfigName"] == sm_model_name:
                if redeploy:
                    print(f"Deleting the endpoint config {sm_model_name:} to redeploy")
                    client.delete_endpoint_config(EndpointConfigName=sm_model_name)
                else:
                    skip_deployment = True
                    print(
                        f"----- Endpoint config with the name {sm_model_name}"
                        + " already exists"
                    )
                    print(
                        "Set redeploy = true to redeploy the endpoint. "
                        + "Moving to the next model -----"
                    )
                    break
    return skip_deployment


def edit_setup_config(setup_config_path, task_id, round_id):
    """
    Adds task_id and round_id to the setup_config
    """
    with open(setup_config_path, "r+") as setup_config_file:
        setup_config = json.load(setup_config_file)
        setup_config["my_task_id"] = task_id
        setup_config["my_round_id"] = round_id
        setup_config_file.seek(0)
        json.dump(setup_config, setup_config_file)
        setup_config_file.truncate()


def generate_settings(task_id, round_id, round_path):
    """
    Generates settings.py file from the secrets.json file in common folder
    """
    secrets_path = join(os.getcwd(), join("common", "secrets.json"))

    with open(secrets_path) as secrets_file:
        secret_config = json.load(secrets_file)

    secret_present = False
    for task in secret_config:
        if task["task_id"] == task_id:
            if task["round_id"] == round_id:
                print("Secret found")
                my_secret = task["my_secret"]
                secret_present = True
                break

    if not secret_present:
        raise AttributeError("Missing the my_secret in secrets.json file.")

    settings_path = join(round_path, "settings.py")
    with open(settings_path, "w") as settings_file:
        settings_file.write(f'my_secret = "{my_secret}"')


def archive_model(sagemaker_model_name, model_path, round_path, task, task_path):
    """
    Archives the model file to mar file
    """

    handler_path = os.path.join(os.getcwd(), round_path, "TransformerHandler.py")
    utils_path = join(os.getcwd(), join("common", "TransformerUtils.py"))
    round_path = join(os.getcwd(), round_path)
    model_path = join(os.getcwd(), model_path)
    # ------------------- Archive -------------------------#
    archiver_command_front = (
        f"torch-model-archiver --model-name {sagemaker_model_name} "
        + f"--version 1.0 --serialized-file {model_path} --handler {handler_path} "
    )
    archiver_command_extra_files_nli = (
        f'--extra-files "{round_path}/settings.py,{round_path}/'
        + f"setup_config.json,{utils_path}"
    )
    archiver_command_extra_files = (
        f"{round_path}/special_tokens_map.json,"
        + f"{round_path}/settings.py,"
        + f"{round_path}/tokenizer_config.json,{round_path}/merges.txt,"
        + f"{round_path}/config.json"
    )
    if task == "nli":
        print(f"----- {task} is archiving -----")
        archiver_command = (
            f'{archiver_command_front} {archiver_command_extra_files_nli}"'
        )

    elif task == "hs" or task == "sentiment":
        print(f"----- {task} is archiving -----")
        archiver_command = (
            f"{archiver_command_front} {archiver_command_extra_files_nli},"
            + f'{archiver_command_extra_files}"'
        )

    elif task == "qa":
        print(f"----- {task} is archiving -----")
        archiver_command = (
            f"{archiver_command_front} {archiver_command_extra_files_nli},"
            + f'{archiver_command_extra_files},{round_path}/qa_utils.py"'
        )
    process = subprocess.run(
        archiver_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        check=False,
        shell=True,
    )
    print(process.stdout)
    print(process.stderr)
    if process.returncode != 0:
        raise ValueError("Error in archiving:" + process.stderr)

    print("----- Mar file tarred -----")
    process = subprocess.run(
        f"tar cvfz {sagemaker_model_name}.tar.gz {sagemaker_model_name}.mar",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        check=True,
        shell=True,
    )
    print(process.stdout)

    print("----- Mar file moved to mars folder -----")
    shutil.move(
        f"{sagemaker_model_name}.tar.gz",
        f"{task_path}/mars/{sagemaker_model_name}.tar.gz",
    )
    shutil.move(
        f"{sagemaker_model_name}.mar", f"{task_path}/mars/{sagemaker_model_name}.mar"
    )


def setup_model(
    model_dir,
    model_path,
    model_url_path,
    given_model_name,
    extension,
    round_path,
    task,
    task_path,
):
    """
    Creates the necessary directory structure for the task and
    downloads the model if needed
    """
    os.makedirs(model_dir, exist_ok=True)
    print(f"Successfully created the directory {model_dir}")
    os.makedirs(os.path.join(task_path, "mars"), exist_ok=True)
    print(f'Successfully created the directory {os.path.join(task_path,"mars")}')

    """ if the model is present in the round's model number folder
        with the given name, use it, \
        rename it to pytorch_model.*"""
    if os.path.exists(os.path.join(model_dir, given_model_name)):
        print(f"----- Using the model {os.path.join(model_dir,given_model_name)} -----")
        print(
            "----- model renamed from"
            + f"{os.path.join(model_dir,given_model_name)} to {model_path} -----"
        )
        os.rename(os.path.join(model_dir, given_model_name), model_path)
    # if the model is present in the round's model number folder with the name
    # pytorch_model.*, use it.
    elif os.path.exists(model_path):
        print(f"------ Using the model {model_path} -----")
    # Else download and use it, rename it to pytorch_model.*
    else:
        print(f"----- Model is downloaded in {model_dir} -----")
        r = requests.get(model_url_path)
        with open(os.path.join(model_dir, given_model_name), "wb") as f:
            f.write(r.content)
        print(
            "----- model renamed from"
            + f"{os.path.join(model_dir,given_model_name)} to {model_path} -----"
        )
        os.rename(os.path.join(model_dir, given_model_name), model_path)

    """ This converts the model from eager mode into torchscript.
    It is commented because we don't \
    convert any models in to torchscript"""
    #     if extension != "pt":
    #         ts.create_ts(round_path,model_dir)
    #         #os.remove(model_path)
    #         renamed_model_name = "pytorch_model.pt"
    #         model_path = os.path.join(model_dir,renamed_model_name)

    return model_path


def load_validate_deploy_config(deploy_config_path):
    """
    Loads the deploy_config and validates the values
    """
    with open(deploy_config_path) as deploy_config_file:
        deploy_config = json.load(deploy_config_file)

    # Check if all the attributes are present
    attributes_list = [
        "task",
        "task_id",
        "round_id",
        "model_no",
        "model_url",
        "initial_instance_count",
        "gateway_url",
        "sagemaker_role",
        "instance_type",
    ]
    if not TransformerUtils.check_fields(deploy_config, attributes_list):
        raise AttributeError("Attributes missing in deploy_config file")

    task = deploy_config["task"]
    task_id = deploy_config["task_id"]
    round_id = deploy_config["round_id"]
    model_no = deploy_config["model_no"]
    model_url_path = deploy_config["model_url"]
    initial_instance_count = deploy_config["initial_instance_count"]
    gateway_url = deploy_config["gateway_url"]
    sagemaker_role = deploy_config["sagemaker_role"]
    instance_type = deploy_config["instance_type"]

    """ If the redeploy attribute is present in the config,
    it is set accordingly otherwise \
    redeploy has the default value of False"""
    if "redeploy" in deploy_config:
        redeploy = deploy_config["redeploy"]
    else:
        redeploy = False
    return (
        task,
        round_id,
        model_no,
        model_url_path,
        initial_instance_count,
        gateway_url,
        sagemaker_role,
        task_id,
        redeploy,
        instance_type,
    )


def clean_mar_file(sagemaker_model_name):
    if os.path.exists(join(os.getcwd(), f"{sagemaker_model_name}.mar")):
        os.remove(join(os.getcwd(), f"{sagemaker_model_name}.mar"))
        print("Existing mar file in the torchserve folder is removed")


if __name__ == "__main__":

    # user arguments loaded from deploy_config folder
    config_path = join(os.getcwd(), "deploy_configs")
    deploy_config_paths = [
        join(config_path, f)
        for f in listdir(config_path)
        if isfile(join(config_path, f))
    ]

    if not deploy_config_paths:
        raise FileNotFoundError("The deploy_configs directory is empty")

    deploy_config_paths.sort()

    # Process each deploy_config.json file in deploy_configs folder and launch
    # an endpoint
    for deploy_config_path in deploy_config_paths:
        round_path = None

        try:
            print(f"----- New model deployment -----")
            (
                task,
                round_id,
                model_no,
                model_url_path,
                initial_instance_count,
                gateway_url,
                sagemaker_role,
                task_id,
                redeploy,
                instance_type,
            ) = load_validate_deploy_config(deploy_config_path)

            sagemaker_model_name = f"{task}_r{round_id}_{model_no}"
            sm_model_name = f"{task}-r{str(round_id)}-{model_no}"

            print(f"----- Starting the deployment of the model {sm_model_name}-----")
            # cleans the unnecessary mar files
            clean_mar_file(sagemaker_model_name)
            # ----- Model name and model path construction-----

            given_model_name = model_url_path.split("/")[-1]
            extension = given_model_name.split(".")[-1]
            model_name = "pytorch_model." + extension
            task_path = f"tasks/{task}"
            model_dir = f"{task_path}/r{str(round_id)}/r{str(round_id)}_{str(model_no)}"
            model_path = os.path.join(model_dir, model_name)
            round_path = f"{task_path}/r{str(round_id)}"

            print("----- Generate settings.py -----")

            generate_settings(task_id, round_id, round_path)

            print("----- Setup sagemaker variables -----")
            (
                region,
                account,
                prefix,
                registry_name,
                role,
                bucket_name,
                client,
            ) = setup_env(sagemaker_role)
            print("----- Handle existing endpoints -----")
            skip_deployment = handle_existing_endpoints(client, sm_model_name, redeploy)
            # The deployment of the model is skipped if the endpoint or the
            # model already present.
            if skip_deployment:
                continue

            # Adds my_task_id and my_round_id in setup_config.json of the
            # particular round
            print("----- Edit setup_config -----")
            setup_config_path = join(round_path, "setup_config.json")
            edit_setup_config(setup_config_path, task_id, round_id)

            """ If a directory path is given instead of url_path,
            then we move the model inside the round's \
            model_number folder (ie qa/r2/r2_2/)"""
            if os.path.exists(os.path.join(os.getcwd(), model_url_path)):
                shutil.move(model_url_path, os.path.join(model_dir, given_model_name))

            s3_folder = task
            tar_file_path = f"{task}/mars/{sagemaker_model_name}.tar.gz"

            print("----- Set up the model  -----")
            ts_model_path = setup_model(
                model_dir,
                model_path,
                model_url_path,
                given_model_name,
                extension,
                round_path,
                task,
                task_path,
            )
            print("------ Archive model -----")
            archive_model(
                sagemaker_model_name, ts_model_path, round_path, task, task_path
            )

            print("----- Tar file copied to s3 -----")
            s3_client = boto3.client("s3")
            response = s3_client.upload_file(
                f"{task_path}/mars/{sagemaker_model_name}.tar.gz",
                bucket_name,
                f"{prefix}/models/{task}/{sagemaker_model_name}.tar.gz",
            )
            if response:
                print(f"Response from the mar file upload to s3 {response}")

            print("----- Setup deployment variables -----")
            image_label = "v1"
            image = (
                f"{account}.dkr.ecr.{region}.amazonaws.com/"
                + f"{registry_name}:{image_label}"
            )
            model_data = (
                f"s3://{bucket_name}/{prefix}/models/{s3_folder}/"
                + f"{sagemaker_model_name}.tar.gz"
            )
            # Create model in sagemaker by loading the archive in tar file
            torchserve_model = Model(
                model_data=model_data,
                image_uri=image,
                role=role,
                predictor_cls=Predictor,
                name=sm_model_name,
            )

            print("----- Creating endpoint -----")

            endpoint_name = sm_model_name
            # Change the initial_instance_count to the number of instances you
            # want to be launched.
            predictor = torchserve_model.deploy(
                instance_type=instance_type,
                initial_instance_count=initial_instance_count,
                endpoint_name=endpoint_name,
            )
            exposed_endpoint = f"{gateway_url}?model={sm_model_name}"
            print("Model endpoint url = ", exposed_endpoint)

        except AttributeError as error:
            print(error)
            print(traceback.format_exc())
        except FileNotFoundError as error:
            print(error)
            print(traceback.format_exc())
        except BaseException as error:
            print(f"An exception occurred: {error}")
            print(traceback.format_exc())

        finally:
            if round_path is not None and os.path.exists(
                join(round_path, "settings.py")
            ):
                print(f"Removing settings.py from {round_path}")
                os.remove(join(round_path, "settings.py"))
    print("----- Execution completed -----")
