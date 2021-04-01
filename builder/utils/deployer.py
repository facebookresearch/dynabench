import base64
import json
import logging
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
import time

import boto3
import sagemaker
from sagemaker.model import Model
from sagemaker.predictor import Predictor
from tqdm import tqdm

from deploy_config import deploy_config
from utils.logging import logger
from dynalab_cli.utils import SetupConfigHandler


class ModelDeployer:
    def __init__(self, model_name, s3_uri):
        self.name = model_name
        s3_bucket, s3_path, self.s3_dir, self.unique_name = self.parse_s3_uri(s3_uri)
        self.repository_name = self.unique_name.lower()
        logger.info(f"{model_name} folder loaded temporarily at {self.tmp_dir}")
        self.rootp = tempfile.TemporaryDirectory(prefix=self.unique_name)
        self.root_dir = self.rootp.name
        logger.info(f"{model_name} folder loaded temporarily at {self.root_dir}")
        self.archive_name = f"archive.{self.unique_name}"

        self.env = self.setup_sagemaker_env()
        self.owd = os.getcwd()

        try:
            self.config_handler = self.initialize(s3_bucket, s3_path)
            self.config = self.config_handler.load_config()
        except Exception as ex:
            logger.exception(
                f"Exception in fetching model folder and loading config {ex}"
            )
            raise RuntimeError("Exception in fetching model folder and loading config")

    def parse_s3_uri(self, s3_uri):
        parts = s3_uri.replace("s3://", "").split("/")
        s3_bucket = parts[0]
        s3_path = "/".join(parts[1:])
        s3_dir = os.path.dirname(s3_path)
        unique_name = os.path.basename(s3_path).replace(".tar.gz", "")
        return s3_bucket, s3_path, s3_dir, unique_name

    def initialize(self, s3_bucket, s3_path):
        if os.path.exists(self.root_dir):
            shutil.rmtree(self.root_dir)
        os.makedirs(self.root_dir)
        os.chdir(self.root_dir)
        logger.info(f"Fetching model folder {s3_path} for {self.name}")
        self._fetch_folder(s3_bucket, s3_path)
        logger.info("Load the model setup config")
        config_handler = SetupConfigHandler(self.name)
        return config_handler

    def _fetch_folder(self, s3_bucket, s3_path):
        save_tarball = f"{self.unique_name}.tar.gz"
        response = self.env["s3_client"].download_file(s3_bucket, s3_path, save_tarball)
        if response:
            logger.debug(f"Response from fetching S3 folder {response}")

        subprocess.run(shlex.split(f"tar xf {shlex.quote(save_tarball)}"))
        os.remove(save_tarball)

    def setup_sagemaker_env(self):
        env = {}

        session = boto3.Session(
            aws_access_key_id=deploy_config["aws_access_key_id"],
            aws_secret_access_key=deploy_config["aws_secret_access_key"],
            region_name=deploy_config["aws_region"],
        )
        env["region"] = session.region_name
        env["account"] = session.client("sts").get_caller_identity().get("Account")
        env["sagemaker_client"] = session.client("sagemaker")
        env["s3_client"] = session.client("s3")
        env["ecr_client"] = session.client("ecr")

        env["sagemaker_session"] = sagemaker.Session(boto_session=session)
        env["bucket_name"] = env["sagemaker_session"].default_bucket()

        env["ecr_registry"] = f"{env['account']}.dkr.ecr.{env['region']}.amazonaws.com"

        return env

    def delete_existing_endpoints(self):
        # remove endpoint
        endpoint_response = self.env["sagemaker_client"].list_endpoints(
            SortBy="Name",
            SortOrder="Ascending",
            MaxResults=100,
            NameContains=self.unique_name,
        )
        endpoints = endpoint_response["Endpoints"]
        for endpoint in endpoints:
            if endpoint["EndpointName"] == self.unique_name:
                logger.info(f"- Deleting the endpoint {self.unique_name:}")
                self.env["sagemaker_client"].delete_endpoint(
                    EndpointName=self.unique_name
                )

        # remove sagemaker model
        model_response = self.env["sagemaker_client"].list_models(
            SortBy="Name",
            SortOrder="Ascending",
            MaxResults=100,
            NameContains=self.unique_name,
        )
        sm_models = model_response["Models"]
        for sm_model in sm_models:
            if sm_model["ModelName"] == self.unique_name:
                logger.info(f"- Deleting the model {self.unique_name:}")
                self.env["sagemaker_client"].delete_model(ModelName=self.unique_name)

        # remove config
        config_response = self.env["sagemaker_client"].list_endpoint_configs(
            SortBy="Name",
            SortOrder="Ascending",
            MaxResults=100,
            NameContains=self.unique_name,
        )
        endpoint_configs = config_response["EndpointConfigs"]
        for endpoint_config in endpoint_configs:
            if endpoint_config["EndpointConfigName"] == self.unique_name:
                logger.info(f"- Deleting the endpoint config {self.unique_name:}")
                self.env["sagemaker_client"].delete_endpoint_config(
                    EndpointConfigName=self.unique_name
                )

        # remove docker image
        # TODO: manage deletion by version
        try:
            response = self.env["ecr_client"].delete_repository(
                repositoryName=self.repository_name, force=True
            )
            logger.info(f"- Deleting the docker repository {self.repository_name:}")
        except self.env["ecr_client"].exceptions.RepositoryNotFoundException:
            logger.info(
                f"Repository {self.repository_name} not found. If deploying, this will be created"
            )
        else:
            if response:
                logger.info(f"Response from deleting ECR repository {response}")

    def _parse_docker_build_status(self, line):
        ## TODO: use re for this function
        status_start = line.find("[")
        status_end = line.find("]")
        if status_start != -1:
            status = line[status_start + 1 : status_end]
            if "/" in status:
                cur, N = [int(n.strip()) for n in status.split("/")]
                return cur, N
        return None

    def build_docker(self, secret):
        docker_dir = os.path.join(sys.path[0], "dockerfiles")
        for f in os.listdir(docker_dir):
            shutil.copyfile(os.path.join(docker_dir, f), os.path.join(self.root_dir, f))

        # tarball current folder but exclude checkpoints 
        exclude_list_file = "exclude.txt"
        self.config_handler.write_exclude_filelist(exclude_list_file, self.name, exclude_model=True)
        process = subprocess.run(
            [
                "tar",
                f"--exclude-from={exclude_list_file}",
                "-czf",
                shlex.quote(f"{self.unique_name}.tar.gz"),
                ".",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            raise RuntimeError(
                f"Exception in tarballing the project directory {process.stderr}"
            )

        # build docker
        docker_build_args = f"--build-arg tarball_name={shlex.quote(self.unique_name)} --build-arg requirements={shlex.quote(str(self.config['requirements']))} --build-arg setup={shlex.quote(str(self.config['setup']))} --build-arg my_secret={secret}"
        docker_build_command = f"docker build --network host -t {shlex.quote(self.repository_name)} -f Dockerfile {docker_build_args} ."
        with subprocess.Popen(
            shlex.split(docker_build_command),
            bufsize=1,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        ) as process:
            N = 0
            nextline = process.stderr.readline().rstrip("\n")
            while nextline or process.poll() is None:
                if nextline:
                    logger.debug(nextline)
                    status = self._parse_docker_build_status(nextline)
                    if status:
                        N = status[1]
                        break
                else:
                    time.sleep(1)
                nextline = process.stderr.readline().rstrip("\n")
            with tqdm(total=N + 1, unit="steps", desc="docker build") as t:
                while nextline or process.poll() is None:
                    if nextline:
                        logger.debug(nextline)
                        status = self._parse_docker_build_status(nextline)
                        if status:
                            cur = status[0]
                            if cur > t.n:
                                t.update(cur - t.n)
                                time.sleep(0.1)
                    else:
                        time.sleep(1)
                    nextline = process.stderr.readline().rstrip("\n")
                _, stderr = process.communicate()
                logger.debug(stderr)
                while t.n < t.total:
                    t.update(1)

            if process.returncode != 0:
                logger.exception(f"Error in docker build for model {self.name}")
                raise RuntimeError("Error in docker build")

    def build_and_push_docker(self, secret):
        logger.info(f"Building docker for model {self.name}")
        self.build_docker(secret)

        # docker login
        docker_credentials = self.env["ecr_client"].get_authorization_token()[
            "authorizationData"
        ][0]["authorizationToken"]
        user, p = base64.b64decode(docker_credentials).decode("ascii").split(":")
        process = subprocess.run(
            shlex.split(f"docker login -u {user} -p {p} {self.env['ecr_registry']}"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker login")
        else:
            logger.debug(process.stdout)
        # tag docker
        image_ecr_path = f"{self.env['ecr_registry']}/{self.repository_name}"
        process = subprocess.run(
            shlex.split(
                f"docker tag {shlex.quote(self.repository_name)} {shlex.quote(image_ecr_path)}"
            ),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker tag")
        else:
            logger.debug(process.stdout)

        # create ECR repo
        logger.info(f"Create ECR repository for model {self.name}")
        try:
            response = self.env["ecr_client"].create_repository(
                repositoryName=self.repository_name,
                imageScanningConfiguration={"scanOnPush": True},
            )
        except self.env["ecr_client"].exceptions.RepositoryAlreadyExistsException as e:
            logger.debug(f"Reuse existing repository since {e}")
        else:
            if response:
                logger.debug(f"Response from creating ECR repository {response}")

        # push docker
        logger.info(f"Pushing docker instance {image_ecr_path} for model {self.name}")
        process = subprocess.run(
            shlex.split(f"docker push {shlex.quote(image_ecr_path)}"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in docker push")
        else:
            logger.debug(process.stdout)
        return image_ecr_path

    def archive_and_upload_model(self):
        # torchserve archive model to .tar.gz (.mar)
        # TODO: allow proper model versioning together with docker tag
        logger.info(f"Archiving the model {self.name} ...")
        archive_command = [
            "torch-model-archiver",
            "--model-name",
            shlex.quote(self.archive_name),
            "--serialized-file",
            shlex.quote(self.config["checkpoint"]),
            "--handler",
            shlex.quote(self.config["handler"]),
            "--version",
            "1.0",  # TODO: proper versioning
            "-f",
        ]
        if self.config["model_files"]:
            extra_files = ",".join(
                shlex.quote(f) for f in self.config["model_files"]
            )
            archive_command += ["--extra-files", extra_files]
        process = subprocess.run(
            archive_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in torch-model-archiver")
        else:
            logger.debug(process.stdout)

        # tarball the .mar
        logger.info(f"Tarballing the archived model {self.name} ...")
        tarball_name = f"{self.archive_name}.tar.gz"
        mar_name = f"{self.archive_name}.mar"
        tarball_command = [
            "tar",
            "cfz",
            shlex.quote(tarball_name),
            shlex.quote(mar_name),
        ]
        process = subprocess.run(
            tarball_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        )
        if process.returncode != 0:
            logger.exception(process.stderr)
            raise RuntimeError("Error in tarballing archived torch model")
        else:
            logger.debug(process.stdout)

        # upload model tarball to S3
        logger.info(f"Uploading the archived model {self.name} to S3 ...")
        tarball = f"{self.archive_name}.tar.gz"
        response = self.env["s3_client"].upload_file(
            tarball, self.env["bucket_name"], f"{self.s3_dir}/{tarball}"
        )
        if response:
            logger.debug(f"Response from the mar file upload to s3 {response}")
        model_s3_path = f"s3://{self.env['bucket_name']}/{self.s3_dir}/{tarball}"
        return model_s3_path

    def deploy_model(self, image_ecr_path, model_s3_path):
        logger.info(f"Deploying model {self.name} to Sagemaker")
        torchserve_model = Model(
            model_data=model_s3_path,
            image_uri=image_ecr_path,
            role=deploy_config["sagemaker_role"],
            sagemaker_session=self.env["sagemaker_session"],
            predictor_cls=Predictor,
            name=self.unique_name,
        )

        torchserve_model.deploy(
            instance_type=deploy_config["instance_type"],
            initial_instance_count=1,
            endpoint_name=self.unique_name,
        )
        return f"{deploy_config['gateway_url']}?model={self.unique_name}"

    def deploy(self, secret):
        self.delete_existing_endpoints()
        image_ecr_path = self.build_and_push_docker(secret)
        model_s3_path = self.archive_and_upload_model()
        endpoint_url = self.deploy_model(image_ecr_path, model_s3_path)
        return endpoint_url

    def cleanup_post_deployment(self):
        try:
            os.chdir(self.owd)
            self.rootp.cleanup()
            # clean up local docker images

            subprocess.run(
                shlex.split(f"docker rmi {shlex.quote(self.repository_name)}")
            )
            image_tag = f"{self.env['ecr_registry']}/{self.repository_name}"
            subprocess.run(shlex.split(f"docker rmi {shlex.quote(image_tag)}"))
        except Exception as ex:
            logger.exception(
                f"Clean up post deployment for {self.unique_name} failed: {ex}"
            )

    def cleanup_on_failure(self):
        try:
            self.cleanup_post_deployment()
            self.delete_existing_endpoints()
            self.env["s3_client"].delete_object(
                Bucket=self.env["bucket_name"],
                Key=f"{self.s3_dir}/{self.archive_name}.tar.gz",
            )
        except Exception as ex:
            logger.exception(
                f"Clean up on failed deployment for {self.unique_name} failed: {ex}"
            )
