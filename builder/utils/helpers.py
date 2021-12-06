# Copyright (c) Facebook, Inc. and its affiliates.

import hashlib

import pickle
import requests
import json

class dotdict(dict):
    """dot.notation access to dictionary attributes"""
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def load_queue_dump(path, logger=None):
    try:
        queue = pickle.load(open(path, "rb"))
        if logger:
            logger.info(f"Load existing queue from {path}.")
        return queue
    except FileNotFoundError:
        if logger:
            logger.info("No existing deployment queue found. Re-initializing...")
        return []

# Decentralized Eaas Helpers
def api_model_update(DYNABENCH_API, decen_eaas_secret, model, model_status, prod=False):
    data = {"deployment_status": model_status}

    r = requests.post(
        f"{DYNABENCH_API}/models/{model.id}/update_decen_eaas",
        data=json.dumps(wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod
    )
 
def api_send_email(DYNABENCH_API, decen_eaas_secret, model, msg, subject, template, prod=False):
    data = {
        "secret": model.secret, 
        "template": template,
        "msg": str(msg),
        "subject": subject
    }

    r = requests.post(
        f"{DYNABENCH_API}/models/{model.id}/email_decen_eaas",
        data=json.dumps(wrap_data(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod
    )

def api_download_model(DYNABENCH_API, decen_eaas_secret, model_id, model_secret, prod=False):
    data = {
        "model_id": model_id,
        "secret": model_secret
    }

    with requests.get(
        f"{DYNABENCH_API}/models/{model_id}/download", 
        data=json.dumps(wrap_data(data, decen_eaas_secret)), 
        headers={"Content-Type": "application/json"},
        verify=prod,
        stream=True
    ) as r:
        download_filename = f"/tmp/modeldownloadid_{model_id}.tar.gz"
        r.raise_for_status()
        with open(download_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): 
                f.write(chunk)
        return download_filename

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