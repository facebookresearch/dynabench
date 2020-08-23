"""
This is a handler passed to the torchserve to serve the model.
It loads up the model and handles requests. This code is specific for NLI round 3
"""

import traceback
import json
import logging
import os
import ast
import hashlib
import uuid
import sys
logger = logging.getLogger(__name__)
import time
sys.path.append("/home/model-server/anli/src")

import torch
from ts.torch_handler.base_handler import BaseHandler

from shared import generate_response_signature, check_fields, remove_sp_chars, handler_initialize, \
    summarize_attributions, get_nli_word_token, captum_nli_forward_func
from settings import my_secret

# ================== Round 4 imports =================
try:
    from flint.data_utils.batchbuilder import move_to_device
    from flint.data_utils.fields import RawFlintField, LabelFlintField, ArrayIndexFlintField
    from utils import common, list_dict_data_tool, save_tool
    from nli.training import MODEL_CLASSES, registered_path, build_eval_dataset_loader_and_sampler, NLITransform, NLIDataset, count_acc, evaluation_dataset
    from nli.inference_debug import eval_model
except Exception as error:
    print(" ".join(os.listdir("/home/model-server")))
    print(error)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print(exc_type, fname, exc_tb.tb_lineno)
    print(traceback.format_exc())
    quit()

class Args(object):
    def __init__(self, model_class_name):
        self.model_class_name = model_class_name

class NliTransformerHandler(BaseHandler):
    """
    Transformers handler class for NLI.
    """

    def __init__(self):
        super(NliTransformerHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        model_dir, model_pt_path, self.device, self.setup_config \
                  = handler_initialize(ctx)

        self.max_length = 184

        model_checkpoint_path = model_pt_path
        args = Args("roberta-large") # hardcode for now
        num_labels = 3

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        device_num = -1
        model_class_item = MODEL_CLASSES[args.model_class_name]
        model_name = model_class_item['model_name']
        do_lower_case = model_class_item['do_lower_case'] \
                if 'do_lower_case' in model_class_item else False

        self.tokenizer = model_class_item['tokenizer'].from_pretrained(model_name, \
                                do_lower_case=do_lower_case)

        self.model = model_class_item['sequence_classification'].from_pretrained(model_name, \
                                num_labels=num_labels)

        self.model.load_state_dict(torch.load(model_checkpoint_path, \
                map_location=torch.device('cpu')))
        self.args = args
        self.model_name = model_name
        self.model_class_item = model_class_item
        self.initialized = True

    def preprocess(self, data):
        body = data[0]["body"]
        attribute_list = ["context", "hypothesis"]
        check_fields(body, attribute_list)
        if "insight" not in body:
            body["insight"] = False
        if "target" not in body:
            body["target"] = 0

        context = body["context"]
        hypothesis = body["hypothesis"]
        insight = body["insight"]
        target = body["target"]

        padding_token_value = self.tokenizer.convert_tokens_to_ids([self.tokenizer.pad_token])[0]
        padding_segement_value = self.model_class_item["padding_segement_value"]
        padding_att_value = self.model_class_item["padding_att_value"]
        left_pad = self.model_class_item['left_pad'] if 'left_pad' in self.model_class_item else False

        batch_size_per_gpu_eval = 16

        eval_data_list = [{
            'uid': str(uuid.uuid4()),
            'premise': context,
            'hypothesis': hypothesis,
            'label': 'e' # TODO: If this is h, things crash..
        }]

        batching_schema = {
            'uid': RawFlintField(),
            'y': LabelFlintField(),
            'input_ids': ArrayIndexFlintField(pad_idx=padding_token_value, left_pad=left_pad),
            'token_type_ids': ArrayIndexFlintField(pad_idx=padding_segement_value, left_pad=left_pad),
            'attention_mask': ArrayIndexFlintField(pad_idx=padding_att_value, left_pad=left_pad),
        }

        data_transformer = NLITransform(self.model_name, self.tokenizer, self.max_length)

        d_dataset, d_sampler, d_dataloader = build_eval_dataset_loader_and_sampler( \
                eval_data_list, data_transformer, \
                batching_schema, \
                batch_size_per_gpu_eval)

        return d_dataloader, insight, target

    def inspect(self, d_dataloader, target):
        # TODO: TBD
        # Easiest way to handle this is probably to defer to the model, so
        # if we can define a inspect_model() in the ANLI codebase that returns
        # the Captum scores, we're good
        pass

    def inference(self, d_dataloader):
        result = eval_model(self.model, d_dataloader, -1, self.args)
        result[0]["prob"] = result[0]["probability"].tolist()
        del result[0]["probability"]
        return result

    def postprocess(self, inference_output, data):
        """
        Post-processing of the model predictions to handle signature
        """
        inference_output, data = inference_output[0], data[0]["body"]
        data["s1"] = data["context"]
        data["s2"] = data["hypothesis"]
        # The input and the output probabilities are concatenated to generate signature
        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = remove_sp_chars(data["s1"])
        inference_output["s2"] = remove_sp_chars(data["s2"])
        #inference_output["y"] = data["y"]
        inference_output["status"] = "finished"
        inference_output["model_name"] = self.model_name

        inference_output["signed"] = generate_response_signature(self.my_task_id, \
            self.my_round_id, my_secret, stringlist)
        logger.info(inference_output)
        logger.info(f"response before json '{inference_output}'" )
        return [inference_output]

_service = NliTransformerHandler()

def handle(data, context):
    """
    This function handles the requests for the model and returns a postprocessed response
    # Sample input {
        "context": "Please pretend you are reviewing a place, product, book or movie",
        "hypothesis": "pretend you are reviewing a place",
        "insight": true
        "target": 0 or 1 or 2 (0 - entail, 1 - neutral, 2 - contradict)
    } and output response is probabilities
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None
        dl, insight, target = _service.preprocess(data)
        if not insight:
            output = _service.inference(dl)
            response = _service.postprocess(output, data)
        else:
            response = _service.inspect(dl, target)

        logger.info(response)
        return response
    except AttributeError as e:
        raise e
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise e
