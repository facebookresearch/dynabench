# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# example usage:
# python perturb.py
# --s3-uri s3://evaluation-us-west-1-096166425824/datasets/nli/zm-mnli-dev-matched.jsonl
# --task nli --perturb-prefix fairness

import argparse
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

import boto3
from dynalab_cli.utils import get_tasks

from augly_perturbation import AuglyPerturbation


sys.path.append("..")  # noqa
from eval_config import eval_config as config  # isort:skip

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("perturb")

perturbations = ["fairness", "robustness"]  # TODO: get this from task config


def parse_args() -> Any:
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
    parser.add_argument("--seed", type=str, default="")
    parser.add_argument("--num_threads", type=int, default=1)
    args = parser.parse_args()

    return args


def parse_s3_uri(s3_uri: str) -> Tuple[str, str, str]:
    parts = s3_uri.replace("s3://", "").split("/")
    s3_bucket = parts[0]
    s3_path = os.path.join(*parts[1:])
    s3_filename = os.path.basename(s3_path)
    return s3_bucket, s3_path, s3_filename


def download_base_from_s3(args: Any) -> Optional[Tuple[str, str]]:
    # If a local path was passed in, we can just use it
    if os.path.exists(args.s3_uri):
        return args.s3_uri, os.path.basename(args.s3_uri)

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
                    return None

        if response:
            logger.info(f"Response from S3 download {response}")
        logger.info(f"Successfully downloaded {args.s3_uri} to {local_path}")

        return local_path, s3_filename.split(".")[0]

    except Exception as ex:
        logger.exception(f"Failed to download {args.s3_uri} because of {ex}")
        return None


def load_examples(path: str) -> List[Dict[str, Any]]:
    with open(path) as f:
        return [json.loads(line) for line in f]


def perturb(
    path: str, task: str, perturb_prefix: str, seed: int, num_threads: int
) -> str:
    examples = load_examples(path)
    num_examples = len(examples)
    logger.info(f"Loaded {num_examples} to perturb")

    pert = AuglyPerturbation(perturb_prefix, task, seed, num_threads)
    perturbed_examples = pert.perturb(examples)

    outpath = os.path.join(
        os.path.dirname(local_path), f"{perturb_prefix}-{os.path.basename(local_path)}"
    )
    with open(outpath, "w") as f:
        for example in perturbed_examples:
            f.write(json.dumps(example) + "\n")
    logger.info(f"Wrote perturbed dataset to {outpath}")

    return outpath


def print_instructions(args: Any, outpath: str, base_dataset_name: str) -> None:
    logger.info(
        "Once you are happy with the perturbation, use the following command "
        "to upload the data back to S3 and request evaluation\n"
        f"python request_evaluation.py --path {outpath} --task {args.task} "
        f"--perturb-prefix {args.perturb_prefix} "
        f"--base-dataset-name {base_dataset_name}"
    )


if __name__ == "__main__":
    args = parse_args()
    downloaded_dataset = download_base_from_s3(args)
    assert downloaded_dataset, "Failed to download dataset from S3"

    local_path, base_dataset_name = downloaded_dataset
    logger.info("Downloaded dataset; now will perturb examples")
    seed = None if args.seed == "" else int(args.seed)
    outpath = perturb(
        local_path, args.task, args.perturb_prefix, seed, args.num_threads
    )
    print_instructions(args, outpath, base_dataset_name)
    ops = input(f"Remove locally downloaded file at {local_path}? [Y/n] ")
    if ops == "Y":
        os.remove(local_path)
        logger.info(f"Removed locally downloaded {local_path}")
