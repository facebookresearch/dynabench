""" 
This is a handler passed to the torchserve to serve the model. 
It loads up the model and handles requests. This code is specific for specific for hatespeech
"""
from abc import ABC
import json
import logging
import os
import hashlib
import ast
logger = logging.getLogger(__name__)

from transformers import AutoConfig, AutoModelForSequenceClassification, \
    AutoTokenizer, AutoModelForQuestionAnswering, AutoModelForTokenClassification,\
         RobertaForSequenceClassification, RobertaTokenizer
import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler

from settings import my_secret
from TransformerUtils import generate_response_signature, check_fields

class TransformersSeqClassifierHandler(BaseHandler, ABC):
    """
    Transformers handler class for sequence classification
    """
    def __init__(self):
        super(TransformersSeqClassifierHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        self.manifest = ctx.manifest
        properties = ctx.system_properties
        model_dir = properties.get("model_dir")
        serialized_file = self.manifest["model"]["serializedFile"]
        model_pt_path = os.path.join(model_dir, serialized_file)
        self.device = torch.device(
            "cuda:" + str(properties.get("gpu_id"))
            if torch.cuda.is_available()
            else "cpu"
        )
        # read configs for the mode, model_name, etc. from setup_config.json
        setup_config_path = os.path.join(model_dir, "setup_config.json")

        if os.path.isfile(setup_config_path):
            with open(setup_config_path) as setup_config_file:
                self.setup_config = json.load(setup_config_file)
        else:
            logger.warning("Missing the setup_config.json file.")
        
        attribute_list = ["my_task_id", "my_round_id", "model_name", "mode", "do_lower_case", \
            "num_labels", "max_length", "save_mode"]
        if not check_fields(self.setup_config, attribute_list):
            logger.warning("Attributes missing in setup_config file")

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        """Loading the model and tokenizer from checkpoint and config files \
          based on the user's choice of mode further setup config can be added."""
        if self.setup_config["save_mode"] == "torchscript":
            logger.info("Loading torchscript model")
            self.model = torch.jit.load(model_pt_path)
        elif self.setup_config["save_mode"] == "pretrained":
            if self.setup_config["mode"] == "sequence_classification":
                if os.path.isfile(os.path.join(model_dir, "config.json")):
                    logger.info("Loading bin model")
                    config = AutoConfig.from_pretrained(model_dir)
                    self.model = AutoModelForSequenceClassification.from_pretrained(
                        model_dir, config=config)
            else:
                logger.warning("Missing the checkpoint or state_dict.")

        if not os.path.isfile(os.path.join(model_dir, "vocab.json")):
            self.tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
            logger.info("Using default vocab")
        else:
            self.tokenizer = RobertaTokenizer.from_pretrained(model_dir)
            logger.info("Using provided vocab")
        self.model.to(self.device)
        self.model.eval()
        logger.debug("Transformer model from path {0} loaded successfully".format(model_dir))
        self.initialized = True

    def preprocess(self, data):
        """ 
        Basic text preprocessing
        """
        max_length = self.setup_config["max_length"]
        logger.info(f"In preprocess, data's value: '{data}'")
        body = data[0].get("body")

        # Checks if the request contains the necessary attributes
        attribute_list = ["answer", "context", "hypothesis", "insight", "target"]
        if not check_fields(body, attribute_list):
            logger.warning("Attributes missing in the request")

        context = body.get("context")
        input_text = body.get("hypothesis")
        logger.info("In preprocess, body's value: '%s'", body)
        logger.info("In preprocess, context's value: '%s'", context)
        logger.info("In preprocess, hypothesis's value: '%s'", input_text)
        # preprocessing text for sequence_classification and token_classification.
        if self.setup_config["mode"] == "sequence_classification":
            batch_encoding = self.tokenizer.batch_encode_plus([input_text],\
                max_length=int(max_length), pad_to_max_length=True)
            input_ids = torch.tensor(batch_encoding["input_ids"], dtype=torch.long)
            attention_mask = torch.tensor(batch_encoding["attention_mask"], dtype=torch.long)

        return input_text, input_ids, attention_mask, context

    def inference(self, inputs, attention_mask):
        """ 
        Predict the class (or classes) of the received text using the serialized transformers checkpoint.
        """
        # Handling inference for sequence_classification.
        if self.setup_config["mode"] == "sequence_classification":
            self.model.eval()
            with torch.no_grad():
                logger.info("Received text: '%s'", inputs)
                outputs = self.model(inputs, attention_mask)
                logger.info("Outputs of model: '%s'", outputs)
                predictions = F.softmax(outputs[0], dim=1).squeeze()
                predictions = predictions.numpy().tolist()
                logger.info("Model predictions: %s", predictions)

        return predictions

    def postprocess(self, inference_output, data, contx):
        """ 
        Post-processing of the model predictions to handle signature
        """
        pred_str = "|".join(str(x) for x in inference_output)
        stringlist = [pred_str, data]
        response = {}

        response["prob"] = inference_output
        response["signed"] = generate_response_signature(self.my_task_id, self.my_round_id,\
             my_secret, stringlist)
        logger.info("response before json '%s'", response)
        js = json.dumps(response)
        return eval("[" + js + "]")

_service = TransformersSeqClassifierHandler()

def handle(data, context):
    """   
    This function handles the requests for the model and returns a postprocessed response 
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        input_text, inputs, attention_mask, contx = _service.preprocess(data)
        output = _service.inference(inputs, attention_mask)
        response = _service.postprocess(output, input_text, contx)
        return response
    except Exception as e:
        raise e
