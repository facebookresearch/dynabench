import hashlib
import logging
logger = logging.getLogger(__name__)
import os 
import json

import torch 

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    """ 
    This function generates a unique signature based on task, round, input and probability 
    """
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}".format(my_task_id, my_round_id).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logger.info('Signature {}'.format(signed))
    return signed

def check_fields(data, fields):
    """ 
    Checks if the attributes present in the fields list are present in data
    """
    if not data:
        return False
    for f in fields:
        if f not in data:
            print(f"The {f} is not present")
            return False
    return True

def handler_initialize(obj, ctx):
    """
    This functions initializes the variables neccessary for the handler
    """
    obj.manifest = ctx.manifest
    properties = ctx.system_properties
    model_dir = properties["model_dir"]
    serialized_file = obj.manifest["model"]["serializedFile"]
    model_pt_path = os.path.join(model_dir, serialized_file)
    obj.device = torch.device(
        "cuda:" + str(properties["gpu_id"])
        if torch.cuda.is_available() else "cpu")
    # read configs for the mode, model_name, etc. from setup_config.json
    setup_config_path = os.path.join(model_dir, "setup_config.json")

    if os.path.isfile(setup_config_path):
        with open(setup_config_path) as setup_config_file:
            obj.setup_config = json.load(setup_config_file)
    else:
        raise FileNotFoundError("Missing the setup_config.json file.")
    
    attribute_list = ["my_task_id", "my_round_id", "model_name", "mode", "do_lower_case", \
        "num_labels", "max_length", "save_mode"]
    if not check_fields(obj.setup_config, attribute_list):
        raise AttributeError("Attributes missing in setup_config file")

    return model_dir, model_pt_path, obj.device, obj.setup_config

def remove_sp_chars(text):
    """
    This removes special characters from the text
    """
    return ''.join([i if ord(i) < 128 else '' for i in text])