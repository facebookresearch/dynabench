# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import hashlib
import os
import ast
import uuid
import sys
sys.path.append("/home/model-server/anli/src")
logger = logging.getLogger(__name__)
import re

from allennlp.data.iterators import BasicIterator
from allennlp.nn.util import move_to_device

import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler

from settings import my_secret
from shared import generate_response_signature, check_fields, handler_initialize, remove_sp_chars

# ==================== custom imports from anli ===============
from bert_model.modeling import BertMultiLayerSeqClassification
from data_utils.exvocab import ExVocabulary
from data_utils.readers.bert_nli_reader import BertNLIReader
from pytorch_pretrained_bert import BertTokenizer, BertModel, BertAdam
from flint import torch_util

class NliTransformerHandler(BaseHandler):
    """
    Transformer handler class for NLI.
    """

    def __init__(self):
        super(NliTransformerHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        """
        Initializes the model and tokenizer during server start up
        """
        model_dir, model_pt_path, self.device, self.setup_config \
                  = handler_initialize(ctx)

        ## NLI Custom codes
        self.input_list = False
        device_num = -1
        query_l = 64

        # Setup Model
        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]
        self.bert_model_name = self.setup_config["model_name"]
        self.device_num = device_num
        pair_order = "cq"

        self.bert_tokenizer = BertTokenizer.from_pretrained(self.bert_model_name,\
            do_lower_case=self.setup_config["do_lower_case"], cache_dir=model_dir)
        logger.info("The bert tokenizer loaded")

        self.bert_encoder = BertModel.from_pretrained(self.bert_model_name, cache_dir=model_dir)
        logger.info("The bert encoder loaded")

        self.model = BertMultiLayerSeqClassification(self.bert_encoder, num_labels=3, num_of_pooling_layer=1,\
            act_type="tanh", use_pretrained_pooler=True, use_sigmoid=False)
        logger.info("The bert ML seqclassification created")

        self.bert_cs_reader = BertNLIReader(self.bert_tokenizer, False, query_l=query_l, example_filter=None,\
             max_l=self.setup_config["max_length"], pair_order=pair_order)

        logger.info("The bert NLIReader created")

        # model_path = os.path.join(model_dir,'bert_round1.pt')
        if torch.cuda.is_available() and self.device_num != -1:
            self.model.load_state_dict(torch.load(model_pt_path))
        else:
            self.model.load_state_dict(torch.load(model_pt_path, map_location="cpu"))

        logger.info("The state_dict loaded")
        self.model.to(self.device)
        # Setup Model finished

        # Setup label indexing
        unk_token_num = {"tokens": 1}  # work around for initiating vocabulary.
        vocab = ExVocabulary(unk_token_num=unk_token_num)
        vocab.add_token_to_namespace("e", namespace="labels")
        vocab.add_token_to_namespace("n", namespace="labels")
        vocab.add_token_to_namespace("c", namespace="labels")
        vocab.add_token_to_namespace("h", namespace="labels")
        vocab.change_token_with_index_to_namespace("h", -2, namespace="labels")
        self.biterator = BasicIterator(batch_size=32)
        self.biterator.index_with(vocab)
        logger.info("label indexing loaded")
        # label indexing finished
        self.initialized = True

    def preprocess(self, data):
        """
        Basic text preprocessing, based on the user's chocie of application mode.
        """
        #logger.info(f"In preprocess, Recieved data '{data}'")
        body = data[0]["body"]
        if not body:
            raise AttributeError("No body found in the request")

        # Checks if the request contains the necessary attributes
        attribute_list = ["context", "hypothesis", "insight"]
        check_fields(body, attribute_list)
        context = body["context"]
        hypothesis = body["hypothesis"]
        example = {"s1": context, "s2": hypothesis}
        example["y"] = "h"
        example["uid"] = str(uuid.uuid4())
        return [example]

    def inference(self, examples):
        """
        Predict the class (or classes) of the received text using the serialized
        transformers checkpoint.
        """
        instances = self.bert_cs_reader.read(examples)

        e_iter = self.biterator(instances, num_epochs=1, shuffle=True)
        #logger.info(f"In inference, e_iter data '{e_iter}'")

        with_probs = True
        make_int = False
        model = self.model
        id2label = {0: "e", 1: "n", 2: "c"}
        # print("Evaluating ...")
        with torch.no_grad():
            model.eval()
            total_size = 0

            y_pred_list = []
            y_fid_list = []
            y_pid_list = []
            y_element_list = []

            y_logits_list = []
            y_probs_list = []

            for batch_idx, batch in enumerate(e_iter):
                batch = move_to_device(batch, self.device_num)

                eval_paired_sequence = batch["paired_sequence"]
                eval_paired_segments_ids = batch["paired_segments_ids"]
                eval_labels_ids = batch["label"]
                eval_att_mask, _ = torch_util.get_length_and_mask(eval_paired_sequence)

                out = model(eval_paired_sequence, token_type_ids=eval_paired_segments_ids,\
                    attention_mask=eval_att_mask,\
                    mode=BertMultiLayerSeqClassification.ForwardMode.EVAL,labels=eval_labels_ids)

                y_pid_list.extend(list(batch["uid"]))
                y_fid_list.extend(list(batch["fid"]))
                y_element_list.extend(list(batch["item"]))

                y_pred_list.extend(torch.max(out, 1)[1].view(out.size(0)).tolist())
                y_logits_list.extend(out.tolist())

                if with_probs:
                    y_probs_list.extend(F.softmax(out, dim=1).tolist())

                total_size += out.size(0)

        result_items_list = []
        assert len(y_pred_list) == len(y_fid_list)
        assert len(y_pred_list) == len(y_pid_list)
        assert len(y_pred_list) == len(y_element_list)
        assert len(y_pred_list) == len(y_logits_list)

        if with_probs:
            assert len(y_pred_list) == len(y_probs_list)

        for i in range(len(y_pred_list)):
            r_item = dict()
            r_item["fid"] = y_fid_list[i]
            r_item["uid"] = y_pid_list[i] if not make_int else int(y_pid_list[i])
            r_item["logits"] = y_logits_list[i]
            r_item["element"] = y_element_list[i]
            r_item["predicted_label"] = id2label[y_pred_list[i]]

            if with_probs:
                r_item["prob"] = y_probs_list[i]

            result_items_list.append(r_item)

        r_list = result_items_list

        #logger.info("Model predicted: '%s'", r_list)
        return r_list

    def postprocess(self, inference_output, data):
        """
        Post-processing of the model predictions to handle signature
        """
        inference_output = inference_output[0]
        data = data[0]

        # The input and the output probabilities are concatenated to generate signature
        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = remove_sp_chars(data["s1"])
        inference_output["s2"] = remove_sp_chars(data["s2"])
        inference_output["y"] = data["y"]
        inference_output["status"] = "finished"
        inference_output["signed"] = generate_response_signature(self.my_task_id, \
        self.my_round_id, my_secret, stringlist)
        #print(inference_output)
        #logger.info("response before json '%s'", inference_output)
        inference_output
        if self.input_list:
            inference_output = [inference_output]

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
    } and output response is probabilities.
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None
        input_text = _service.preprocess(data)
        output = _service.inference(input_text)
        response = _service.postprocess(output, input_text)
        #print(response)

        return response
    except AttributeError as e:
        raise e
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise e
