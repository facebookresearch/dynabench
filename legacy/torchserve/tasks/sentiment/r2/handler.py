# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import os

import torch
import torch.nn.functional as F
from captum.attr import LayerIntegratedGradients
from transformers import (
    AutoConfig,
    AutoModelForSequenceClassification,
    RobertaTokenizer,
)
from ts.torch_handler.base_handler import BaseHandler

from settings import my_secret
from shared import (
    captum_sequence_forward,
    check_fields,
    construct_input_ref,
    generate_response_signature,
    get_word_token,
    handler_initialize,
    summarize_attributions,
)


logger = logging.getLogger(__name__)


class TransformersSeqClassifierHandler(BaseHandler):
    """
    Transformers handler class for sequence classification
    """

    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, ctx):
        """
        Initializes the model and tokenizer during server start up
        """
        model_dir, model_pt_path, self.device, self.setup_config = handler_initialize(
            ctx
        )

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        """Loading the model and tokenizer from checkpoint and config files \
          based on the user's choice of mode further setup config can be added."""
        if self.setup_config["save_mode"] == "torchscript":
            logger.info("Loading torchscript model")
            self.model = torch.jit.load(model_pt_path)
        elif self.setup_config["save_mode"] == "pretrained":
            if os.path.isfile(os.path.join(model_dir, "config.json")):
                logger.info("Loading bin model")
                config = AutoConfig.from_pretrained(model_dir)
                self.model = AutoModelForSequenceClassification.from_pretrained(
                    model_dir, config=config
                )
            else:
                raise FileNotFoundError("Missing config file")

        if os.path.isfile(os.path.join(model_dir, "vocab.json")):
            self.tokenizer = RobertaTokenizer.from_pretrained(model_dir)
            logger.info("Using provided vocab")
        else:
            self.tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
            logger.info("Using default vocab")

        self.model.to(self.device)
        self.model.eval()
        logger.debug(f"Transformer model from path {model_dir} loaded successfully")

        # ------------- Captum initialization ------------#
        self.lig = LayerIntegratedGradients(
            captum_sequence_forward, self.model.roberta.embeddings
        )
        self.initialized = True

    def preprocess(self, data):
        """
        Basic text preprocessing
        """
        max_length = self.setup_config["max_length"]
        logger.info("In preprocess, data's value: '%s'", data)

        body = data[0]["body"]
        if not body:
            raise AttributeError("No body found in the request")

        # Checks if the request contains the necessary attributes
        attribute_list = ["context", "hypothesis", "insight"]
        check_fields(body, attribute_list)

        context = body["context"]
        input_text = body["hypothesis"]
        insight = body["insight"]
        target = 0
        if insight:
            target = body["target"]
        logger.info("In preprocess, body's value: '%s'", body)
        logger.info("In preprocess, context's value: '%s'", context)
        logger.info("In preprocess, hypothesis's value: '%s'", input_text)
        # preprocessing text for sequence_classification and
        # token_classification.
        batch_encoding = self.tokenizer.batch_encode_plus(
            [input_text], max_length=int(max_length), pad_to_max_length=True
        )
        input_ids = torch.tensor(batch_encoding["input_ids"], dtype=torch.long)
        attention_mask = torch.tensor(
            batch_encoding["attention_mask"], dtype=torch.long
        )

        return input_text, input_ids, attention_mask, context, insight, target

    def inference(self, inputs, attention_mask):
        """
        Predict the class (or classes) of the received text using the serialized \
        transformers checkpoint.
        """
        # Handling inference for sequence_classification.
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
        # The input text and the output probabilities are concatenated to
        # generate signature
        pred_str = "|".join(str(x) for x in inference_output)
        stringlist = [pred_str, data]
        response = {}

        response["prob"] = inference_output
        response["signed"] = generate_response_signature(
            self.my_task_id, self.my_round_id, my_secret, stringlist
        )
        logger.info("response before json '%s'", response)
        js = json.dumps(response)
        return eval("[" + js + "]")


_service = TransformersSeqClassifierHandler()


def get_insights(text, target, tokenizer, device, lig, model):
    """
    This function calls the layer integrated gradient to get word importance
    of the input text
    """
    input_ids, ref_input_ids, attention_mask = construct_input_ref(
        text, tokenizer, device
    )
    all_tokens = get_word_token(input_ids, tokenizer)
    attributions, _ = lig.attribute(
        inputs=input_ids,
        baselines=ref_input_ids,
        target=target,
        additional_forward_args=(attention_mask, 0, model),
        return_convergence_delta=True,
    )

    attributions_sum = summarize_attributions(attributions)
    response = {}
    response["importances"] = attributions_sum.tolist()
    response["words"] = all_tokens
    return [response]


def handle(data, context):
    """
    This function handles the requests for the model and returns a
    postprocessed response
    #sample input {
      "context": "Please pretend you a reviewing a place, product, book or movie.",
      "hypothesis": "It is a good day",
      "insight": true,
      "target": 0 or 1 (0 - negative, 1 - positive)
    } and output response is probabilities
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        (
            input_text,
            inputs,
            attention_mask,
            contx,
            insight,
            target,
        ) = _service.preprocess(data)
        if not insight:
            output = _service.inference(inputs, attention_mask)
            response = _service.postprocess(output, input_text, contx)
            return response
        else:
            response = get_insights(
                input_text,
                target,
                _service.tokenizer,
                _service.device,
                _service.lig,
                _service.model,
            )
            return response
    except Exception as e:
        raise e
