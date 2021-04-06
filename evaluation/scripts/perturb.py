# Copyright (c) Facebook, Inc. and its affiliates.

# example usage:
# python perturb.py
# --s3-uri s3://evaluation-us-west-1-096166425824/datasets/nli/zm-mnli-dev-matched.jsonl
# --task nli --perturb-prefix fairness

import argparse
import json
import logging
import os
import sys

import boto3

from dynalab_cli.utils import get_tasks
from fairness import FairnessPerturbation
from robustness import RobustnessPerturbation


sys.path.append("..")  # noqa
from eval_config import eval_config as config  # isort:skip

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("perturb")

perturbations = ["fairness", "robustness"]  # TODO: get this from task config


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--s3-uri", type=str, help="The s3 uri, in the format of s3://<bucket>/<path>"
    )
    parser.add_argument(
        "--local-path",
        type=str,
        default="",
        help=(
            "Local path to store the downloaded S3 file, "
            "default will download file to current dir"
        ),
    )
    parser.add_argument(
        "--task", type=str, choices=get_tasks(), help="Task code"
    )  # for selecting the perturb function
    parser.add_argument("--perturb-prefix", type=str, choices=perturbations)
    args = parser.parse_args()

    return args


def parse_s3_uri(s3_uri):
    parts = s3_uri.replace("s3://", "").split("/")
    s3_bucket = parts[0]
    s3_path = os.path.join(*parts[1:])
    s3_filename = os.path.basename(s3_path)
    return s3_bucket, s3_path, s3_filename


def download_base_from_s3(args):
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        s3_bucket, s3_path, s3_filename = parse_s3_uri(args.s3_uri)
        local_path = args.local_path if args.local_path else s3_filename
        response = s3_client.download_file(s3_bucket, s3_path, local_path)
        for prefix in perturbations:
            if s3_filename.startswith(args.perturb_prefix):
                ops = (
                    f"Looks like your base s3_uri {args.s3_uri} already points "
                    "to a perturbed version. Continue the workflow? [Y/n] "
                )
                if ops != "Y":
                    logger.info("Abandoning current workflow")
                    return False

        if response:
            logger.info(f"Response from S3 download {response}")
        logger.info(f"Successfully downloaded {args.s3_uri} to {local_path}")

        return local_path, s3_filename.split(".")[0]

    except Exception as ex:
        logger.exception(f"Failed to download {args.s3_uri} because of {ex}")
        return False


def load_examples(path):
    with open(path, "rt") as f:
        return [json.loads(line) for line in f]


def perturb(path, task, perturb_prefix):
    examples = load_examples(path)
    if perturb_prefix == "fairness":
        pert = FairnessPerturbation()
    elif perturb_prefix == "robustness":
        pert = RobustnessPerturbation()

    perturb_examples = []
    for example in examples:
        perturbed = pert.perturb(task, example)
        perturb_examples.extend(perturbed)

    return perturb_examples


def print_instructions(args, local_path, base_dataset_name):
    logger.info(
        "Once you are happy with the perturbation, use the following command"
        "to upload the data back to S3 and request evaluation\n"
        f"python request_evaluation.py --path {local_path} --task {args.task} "
        f"--perturb-prefix {args.perturb_prefix} "
        f"--base-dataset-name {base_dataset_name}"
    )


if __name__ == "__main__":
    args = parse_args()
    local_path, base_dataset_name = download_base_from_s3(args)
    perturb(local_path, args.task, args.perturb_prefix)
    print_instructions(args, local_path, base_dataset_name)
    ops = input(f"Remove locally downloaded file at {local_path}? [Y/n] ")
    if ops == "Y":
        os.remove(local_path)
        logger.info(f"Removed locally downloaded {local_path}")
