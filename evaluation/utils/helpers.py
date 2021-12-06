# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import hashlib
import json
import os
import tempfile
from datetime import datetime, timedelta
from typing import List

import boto3
import requests
import ujson


def get_predictions_s3_path(endpoint_name, task_code, dataset_name):
    return os.path.join(
        "predictions", endpoint_name, "raw", task_code, f"{dataset_name}.jsonl.out"
    )


def send_eval_request(
    model_id, dataset_name, config, eval_server_id, logger=None, reload_datasets=False
):
    """
    If dataset name is a perturbed dataset with prefix, will evaluate this
    perturbed dataset only;
    else if dataset name is a base dataset name without prefix, will try to
    evaluate itself plus any perturbed dataset available to generate delta metrics
    """
    try:
        assert (
            model_id == "*" or isinstance(model_id, int) or isinstance(model_id, list)
        ), f"model_id can either be an integer, a list of integers, or *"
        assert (
            dataset_name == "*"
            or isinstance(dataset_name, str)
            or isinstance(dataset_name, list)
        ), f"dataset_name can either be a string, a list of strings, or *"
    except AssertionError as ex:
        if logger:
            logger.error(ex)
        return False
    else:
        session = boto3.Session(
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        sqs = session.resource("sqs")
        queue = sqs.get_queue_by_name(QueueName=config["evaluation_sqs_queue"])
        msg = {
            "reload_datasets": reload_datasets,
            "model_id": model_id,
            "dataset_name": dataset_name,
            "eval_server_id": eval_server_id,
        }
        queue.send_message(MessageBody=json.dumps(msg))
        if logger:
            logger.info(f"Sent message to {config['evaluation_sqs_queue']}: {msg}")
        return True


def send_takedown_model_request(model_id, config, s3_uri=None, logger=None):
    if not s3_uri:
        s3_uri = ""
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = session.resource("sqs")
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    msg = {"model_id": model_id, "s3_uri": s3_uri}
    queue.send_message(MessageBody=json.dumps(msg))
    if logger:
        logger.info(f"Sent message to {config['builder_sqs_queue']}: {msg}")
    return True


def round_end_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo) + timedelta(seconds=offset)


def round_start_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo) - timedelta(seconds=offset)


def process_aws_metrics(datapoints):
    """
    Datapoints are a list of dictionaries with exactly the same keys
    """
    return sum([data["Average"] for data in datapoints]) / len(datapoints)


def get_perturb_prefix(dataset_name, datasets):
    if dataset_name in datasets:
        return dataset_name, None

    perturb_prefix = dataset_name.split("-")[0]
    original_dataset_name = dataset_name[len(perturb_prefix) + 1 :]
    if original_dataset_name in datasets:
        return original_dataset_name, perturb_prefix
    else:
        raise RuntimeError(f"Dataset {dataset_name} not found.")


def get_perturbed_filename(filename, perturb_prefix=None):
    filename = f"{perturb_prefix}-{filename}" if perturb_prefix else filename
    return filename


def get_data_s3_path(task, filename, perturb_prefix=None):
    filename = get_perturbed_filename(filename, perturb_prefix)
    return "/".join(("datasets", task, filename))


def path_available_on_s3(s3_client, s3_bucket, path, perturb_prefix=None):
    response = s3_client.list_objects_v2(Bucket=s3_bucket, Prefix=path)
    for obj in response.get("Contents", []):
        if obj["Key"] == path:
            return True
    return False


def parse_s3_uri(s3_uri):
    parts = s3_uri.replace("s3://", "").split("/")
    s3_bucket = parts[0]
    s3_path = "/".join(parts[1:])
    return s3_bucket, s3_path


def update_metadata_json_string(original_json_string, new_json_string_list):
    original_json = json.loads(original_json_string)
    for new_json_string in new_json_string_list:
        new_json = json.loads(new_json_string)
        original_json = {**original_json, **new_json}
    metadata_json_string = json.dumps(original_json)
    return metadata_json_string


def parse_s3_outfile(s3_client, s3_uri: str) -> List[dict]:
    """Download raw predictions file from S3 and parse it.

    We parse batch transform output by balancing brackets,
    since torchserve outputs pretty printed json by default
    """
    raw_s3_bucket, raw_s3_path = parse_s3_uri(s3_uri)
    fd, local_file = tempfile.mkstemp(suffix=raw_s3_path.split("/")[-1])
    s3_client.download_file(raw_s3_bucket, raw_s3_path, local_file)
    os.close(fd)

    predictions = []
    json_lines = True
    with open(local_file) as f:
        tmp = ""
        lb = 0
        for line in f:
            if not (line.startswith("{") and line.endswith("}\n")):
                json_lines = False
            if json_lines:
                # One json per line
                predictions.append(json.loads(line))
                continue
            line = line.strip()
            if line.startswith("{") or line.endswith("{"):
                lb += 1
            elif line.startswith("}") or line.endswith("}"):
                lb -= 1
            if lb == 0 and tmp:
                tmp += line
                predictions.append(json.loads(tmp))
                tmp = ""
            elif line:
                tmp += line
    os.remove(local_file)
    return predictions


def upload_predictions(s3_client, s3_uri: str, predictions: List[dict]) -> None:
    s3_bucket, s3_path = parse_s3_uri(s3_uri)
    fd, parsed_pred_file = tempfile.mkstemp(suffix=s3_uri.split("/")[-1] + ".parsed")
    with open(parsed_pred_file, "w") as f:
        for pred in predictions:
            f.write(json.dumps(pred) + "\n")
    s3_client.upload_file(parsed_pred_file, s3_bucket, s3_path)
    os.close(fd)
    os.remove(parsed_pred_file)


# Decentralized Eaas Helpers
def api_model_eval_update(
    DYNABENCH_API, decen_eaas_secret, model_id, evaluation_status, prod=False
):
    data = {"evaluation_status": evaluation_status}

    _ = requests.get(
        f"{DYNABENCH_API}/models/{model_id}/update_evaluation_status",
        data=json.dumps(wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def api_update_database_with_metrics(
    DYNABENCH_API, decen_eaas_secret, data_pkg, prod=False
):
    r = requests.post(
        f"{DYNABENCH_API}/models/update_database_with_metrics",
        data=json.dumps(wrap_data(data_pkg, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_get_next_job_score_entry(DYNABENCH_API, decen_eaas_secret, job, prod=False):
    str_encoded_obj = ujson.dumps(job, default=str)

    r = requests.get(
        f"{DYNABENCH_API}/models/eval_score_entry",
        data=ujson.dumps(wrap_data(str_encoded_obj, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_model_endpoint_name(DYNABENCH_API, decen_eaas_secret, model_id, prod=False):
    data = {"model_id": model_id}

    r = requests.get(
        f"{DYNABENCH_API}/models/{model_id}/get_model_info",
        data=json.dumps(wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_model_update(DYNABENCH_API, decen_eaas_secret, mid, model_status, prod=False):
    data = {"deployment_status": model_status}

    _ = requests.post(
        f"{DYNABENCH_API}/models/{mid}/update_decen_eaas",
        data=json.dumps(wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def wrap_data(data, secret):
    data_signature = generate_signature(data, secret)

    final_data = {}
    final_data["data"] = data
    final_data["signature"] = data_signature
    return final_data


def generate_signature(data, secret):
    h = hashlib.sha1()
    h.update(f"{data}{secret}".encode("utf-8"))
    signed = h.hexdigest()
    return signed
