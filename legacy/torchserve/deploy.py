# Copyright (c) Facebook, Inc. and its affiliates.

import argparse
import json
import os
import shutil
import subprocess
import tarfile

import boto3
import requests
import sagemaker
from sagemaker.model import Model
from sagemaker.predictor import Predictor

from common import shared


def delete_existing_endpoints(client, sm_model_name):
    endpoint_response = client.list_endpoints(
        SortBy="Name",
        SortOrder="Ascending",
        MaxResults=100,
        StatusEquals="InService",
        NameContains=sm_model_name,
    )
    endpoints = endpoint_response["Endpoints"]
    for endpoint in endpoints:
        if endpoint["EndpointName"] == sm_model_name:
            print(f"- Deleting the endpoint {sm_model_name:} to redeploy")
            client.delete_endpoint(EndpointName=sm_model_name)

    model_response = client.list_models(
        SortBy="Name", SortOrder="Ascending", MaxResults=100, NameContains=sm_model_name
    )
    sm_models = model_response["Models"]
    for sm_model in sm_models:
        if sm_model["ModelName"] == sm_model_name:
            print(f"- Deleting the model {sm_model_name:} to redeploy")
            client.delete_model(ModelName=sm_model_name)

    config_response = client.list_endpoint_configs(
        SortBy="Name", SortOrder="Ascending", MaxResults=100, NameContains=sm_model_name
    )
    endpoint_configs = config_response["EndpointConfigs"]
    for endpoint_config in endpoint_configs:
        if endpoint_config["EndpointConfigName"] == sm_model_name:
            print(f"- Deleting the endpoint config {sm_model_name:} to redeploy")
            client.delete_endpoint_config(EndpointConfigName=sm_model_name)


def generate_settings_file(config):
    secrets_path = os.path.join(os.getcwd(), "common", "secrets.json")
    with open(secrets_path) as secrets_file:
        secret_config = json.load(secrets_file)

    # TODO: Turn this into a dict of dicts
    my_secret = False
    for task in secret_config:
        if task["task_id"] == config["task_id"]:
            if task["round_id"] == config["round_id"]:
                my_secret = task["my_secret"]
                break

    if not my_secret:
        raise AttributeError("Missing the my_secret in secrets.json file.")

    settings_path = os.path.join(config["round_path"], "settings.py")
    with open(settings_path, "w") as settings_file:
        settings_file.write(f'my_secret = "{my_secret}"\n')
        model_no = config["model_no"]
        settings_file.write(f'my_model_no = "{model_no}"')


def archive_model(config):
    handler_path = os.path.join(os.getcwd(), config["round_path"], "handler.py")
    utils_path = os.path.join(os.getcwd(), "common", "shared.py")
    round_path = os.path.join(os.getcwd(), config["round_path"])
    model_path = os.path.join(os.getcwd(), config["model_path"])

    round_model_files = [
        os.path.join(config["model_dir"], fname)
        for fname in os.listdir(config["model_dir"])
        if not fname.startswith(".")
    ]
    include_files = (
        [f"{round_path}/{fname}" for fname in os.listdir(round_path)]
        + [utils_path]
        + round_model_files
    )
    include_files = [f for f in include_files if not os.path.isdir(f)]
    extra_files = ",".join(include_files)
    archiver_command = (
        f'torch-model-archiver --model-name {config["model_name"]} --version 1.0 '
        + f"--serialized-file {model_path} "
        + f'--handler {handler_path} --extra-files "{extra_files}"'
    )
    print(archiver_command)
    process = subprocess.run(
        archiver_command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        shell=True,
    )
    if process.returncode != 0:
        raise ValueError("Error in torch-model-archiver:" + process.stderr)

    process = subprocess.run(
        f"tar cvfz {config['model_name']}.tar.gz {config['model_name']}.mar",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        universal_newlines=True,
        shell=True,
    )
    if process.returncode != 0:
        raise ValueError("Error in archiving:" + process.stderr)

    if not os.path.exists(config["mars_path"]):
        os.makedirs(config["mars_path"])

    shutil.move(
        f"{config['model_name']}.tar.gz",
        os.path.join(config["mars_path"], config["model_name"] + ".tar.gz"),
    )
    shutil.move(
        f"{config['model_name']}.mar",
        os.path.join(config["mars_path"], config["model_name"] + ".mar"),
    )


def setup_model(config):
    os.makedirs(config["model_dir"], exist_ok=True)
    if not os.path.exists(config["model_path"]):
        # return # skipping for now
        print(f"Downloading model from {config['model_url_path']}")
        r = requests.get(config["model_url_path"], stream=True)
        if config["url_extension"].lower() == ".tgz":
            tarfile_path = os.path.join(config["model_dir"], config["given_model_name"])
            with open(tarfile_path, "wb") as f:
                f.write(r.raw.read())
            with tarfile.open(tarfile_path, mode="r") as archive:
                for member in archive.getmembers():
                    if member.isreg():
                        member.name = os.path.basename(member.name)
                        archive.extract(member, path=config["model_dir"])
            os.remove(tarfile_path)
        else:
            with open(config["model_path"], "wb") as f:
                f.write(r.content)


def setup_sagemaker_env(config):
    env = {}

    session = boto3.Session()
    env["region"] = session.region_name
    env["account"] = boto3.client("sts").get_caller_identity().get("Account")
    env["client"] = boto3.client("sagemaker")

    sagemaker_session = sagemaker.Session(boto_session=session)
    env["role"] = config["sagemaker_role"]
    env["bucket_name"] = sagemaker_session.default_bucket()
    if config["task"] == "nli" and config["round_id"] == 4:
        print("NLI round 4, using custom Docker")
        env["registry_name"] = "torchserve2"
    elif config["task"] == "qagen":
        print("Max task, using custom Docker")
        env["registry_name"] = "torchserve-max"
    elif config["task"] == "vqa":
        print("VQA task, using custom Docker")
        env["registry_name"] = "torchserve_vqa"
    else:
        env["registry_name"] = "torchserve"
    env["prefix"] = "torchserve"

    return env


def load_config(config_path):
    with open(config_path) as config_file:
        config = json.load(config_file)

    required_attributes = [
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
    if not shared.check_fields(config, required_attributes):
        raise AttributeError("Attributes missing in config file")

    task = config["task"]
    round_id = config["round_id"]
    model_no = config["model_no"]
    model_url_path = config["model_url"]
    config["model_url_path"] = model_url_path

    config["model_name"] = f"{task}-r{round_id}-{model_no}"
    config["given_model_name"] = config["model_url"].split("/")[-1]
    config["url_extension"] = os.path.splitext(config["given_model_name"])[1]
    config["extension"] = (
        config["url_extension"] if config["url_extension"].lower() != ".tgz" else ".bin"
    )
    config["task_path"] = f"tasks/{task}"
    config["mars_path"] = f"mars"
    config["model_dir"] = f"{config['task_path']}/r{round_id}/r{round_id}_{model_no}/"
    config["model_path"] = os.path.join(
        config["model_dir"],
        config.get("checkpoint_name", f"pytorch_model{config['extension']}"),
    )
    config["round_path"] = f"{config['task_path']}/r{round_id}"

    return config


def clean_mar_file(sagemaker_model_name):
    model_path = os.path.join(os.getcwd(), f"{sagemaker_model_name}.mar")
    if os.path.exists(model_path):
        os.remove(model_path)
        print("Existing mar file in the torchserve folder is removed")


def upload_model(config, env):
    tarball = f"{config['model_name']}.tar.gz"
    s3_client = boto3.client("s3")
    response = s3_client.upload_file(
        os.path.join(config["mars_path"], tarball),
        env["bucket_name"],
        f"{env['prefix']}/models/{config['task']}/{tarball}",
    )
    if response:
        print(f"Response from the mar file upload to s3 {response}")
    model_data = (
        f"s3://{env['bucket_name']}/{env['prefix']}/models/{config['task']}/{tarball}"
    )
    return model_data


def deploy_model(model_data, config, env):
    image_label = "v1"
    image = (
        f"{env['account']}.dkr.ecr.{env['region']}.amazonaws.com/"
        + f"{env['registry_name']}:{image_label}"
    )
    torchserve_model = Model(
        model_data=model_data,
        image_uri=image,
        role=env["role"],
        predictor_cls=Predictor,
        name=config["model_name"],
    )
    torchserve_model.deploy(
        instance_type=config["instance_type"],
        initial_instance_count=config["initial_instance_count"],
        endpoint_name=config["model_name"],
    )
    return f"{config['gateway_url']}?model={config['model_name']}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dynabench Model Deployment")
    parser.add_argument("configs", nargs="+")
    args, remaining_args = parser.parse_known_args()
    assert remaining_args == [], remaining_args

    for config_path in args.configs:
        if not os.path.exists(config_path):
            print(f"Error: Config {config_path} does not exist")
            quit()

        config = load_config(config_path)
        env = setup_sagemaker_env(config)
        print(config)
        print(env)

        print("Cleaning up..")
        clean_mar_file(config["model_name"])
        delete_existing_endpoints(env["client"], config["model_name"])

        print("Setting up..")
        generate_settings_file(config)
        setup_model(config)

        print("Archiving..")
        archive_model(config)

        print("Uploading..")
        model_data = upload_model(config, env)

        print("Deploying..")
        endpoint_url = deploy_model(model_data, config, env)

        print(f"Model running at {endpoint_url}")

        print("Cleaning up..")
        settings_file_path = os.path.join(config["round_path"], "settings.py")
        if os.path.exists(settings_file_path):
            os.remove(settings_file_path)
