# Copyright (c) Facebook, Inc. and its affiliates.

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

# TODO: change to prod = True in build_server_decen.py
def api_model_update(DYNABENCH_API, model, model_status, prod=False):
    data = {"deployment_status": model_status, "secret": model.secret}

    r = requests.post(
        f"{DYNABENCH_API}/models/{model.id}/update_decen_eaas",
        data=json.dumps(data),
        headers={"Content-Type": "application/json"},
        verify=prod
    )
# TODO: change to prod = True in build_server_decen.py
def api_send_email(DYNABENCH_API, model, msg, subject, template, prod=False):
    data = {
        "secret": model.secret, 
        "template": template,
        "msg": msg,
        "subject": subject
    }

    r = requests.post(
        f"{DYNABENCH_API}/models/{model.id}/email_decen_eaas",
        data=json.dumps(data),
        headers={"Content-Type": "application/json"},
        verify=prod
    )