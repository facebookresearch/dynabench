""" 
This is a handler passed to the torchserve to serve the model. 
It loads up the model and handles requests. This code is specific for NLI round 1
"""
from abc import ABC
import json
import logging
import hashlib
import os
import ast
import uuid
import sys
sys.path.append("/home/model-server/anli/src")
logger = logging.getLogger(__name__)

from allennlp.data.iterators import BasicIterator
from allennlp.nn.util import move_to_device

import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
from settings import my_secret
from TransformerUtils import generate_response_signature, check_fields

# ==================== custom imports from anli ===============
from bert_model.modeling import BertMultiLayerSeqClassification
from data_utils.exvocab import ExVocabulary
from data_utils.readers.bert_nli_reader import BertNLIReader
from pytorch_pretrained_bert import BertTokenizer, BertModel, BertAdam
from flint import torch_util

class NliTransformerHandler(BaseHandler, ABC):
    """
    Transformers handler class for NLI.
    """

    def is_validate(self, example):
        if "s1" in example and "s2" in example:
            if "y" not in example:
                example["y"] = "h"
            if "uid" not in example:
                example["uid"] = str(uuid.uuid4())
            return True
        else:
            return False

    def __init__(self):
        super(NliTransformerHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        self.manifest = ctx.manifest
        properties = ctx.system_properties
        model_dir = properties.get("model_dir")
        print("Model Directory ", model_dir)
        print("Self.manifest  ", self.manifest)
        serialized_file = self.manifest["model"]["serializedFile"]
        model_pt_path = os.path.join(model_dir, serialized_file)
        self.device = torch.device( "cuda:" + str(properties.get("gpu_id")) \
            if torch.cuda.is_available() else "cpu")
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
        bert_pretrain_path = model_dir

        self.bert_tokenizer = BertTokenizer.from_pretrained(self.bert_model_name,\
        do_lower_case=self.setup_config["do_lower_case"], cache_dir=bert_pretrain_path)
        logger.info("The bert tokenizer loaded")

        self.bert_encoder = BertModel.from_pretrained(self.bert_model_name, cache_dir=bert_pretrain_path)
        logger.info("The bert encoder loaded")

        self.model = BertMultiLayerSeqClassification(self.bert_encoder, num_labels=3, num_of_pooling_layer=1,\
            act_type="tanh", use_pretrained_pooler=True, use_sigmoid=False)
        logger.info("The bert ML seqclassification created")

        self.bert_cs_reader = BertNLIReader(self.bert_tokenizer, False, query_l=query_l, example_filter=None,\
             max_l=self.setup_config["max_length"], pair_order=pair_order)

        logger.info("The bert NLIReader created")

        # model_path = os.path.join(model_dir,'bert_round1.pt')
        if torch.cuda.is_available() and device_num != -1:
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
        logger.info("In preprocess, Recieved data '%s'", data)
        body = data[0].get("body")

        # Checks if the request contains the necessary attributes
        attribute_list = ["answer", "context", "hypothesis", "insight", "target"]
        if not check_fields(body, attribute_list):
            logger.warning("Attributes missing in the request")

        context_encoded = body["context"].encode("ascii", "ignore")
        hypothesis_encoded = body["hypothesis"].encode("ascii", "ignore")
        context_decoded = context_encoded.decode()
        hypothesis_decoded = hypothesis_encoded.decode()

        bert_input = {"s1": context_decoded, "s2": hypothesis_decoded}
        example = bert_input
        if "s1" in example and "s2" in example:
            if "y" not in example:
                example["y"] = "h"
            if "uid" not in example:
                example["uid"] = str(uuid.uuid4())
        logger.info("In preprocess , example: '%s'", example)

        return example

    def inference(self, examples, show_progress=False):
        """ 
        Predict the class (or classes) of the received text using the serialized 
        transformers checkpoint.
        """
        self.input_list = True  # if input is list, we return list, else we return instance.
        if not isinstance(examples, list):
            self.input_list = False
            examples = [examples]

        instances = self.bert_cs_reader.read(examples)
        logger.info("In inference, instances '%s'", instances)

        e_iter = self.biterator(instances, num_epochs=1, shuffle=True)
        logger.info("In inference, e_iter data '%s'", e_iter)

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

        logger.info("Model predicted: '%s'", r_list)
        return r_list

    def postprocess(self, inference_output, data):
        """ 
        Post-processing of the model predictions to handle signature 
        """
        inference_output = inference_output[0]

        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = data["s1"]
        inference_output["s2"] = data["s2"]
        inference_output["y"] = data["y"]
        inference_output["status"] = "finished"
        inference_output["signed"] = generate_response_signature(self.my_task_id, \
        self.my_round_id, my_secret, stringlist)
        print(inference_output)
        logger.info("response before json '%s'", inference_output)

        if self.input_list:
            inference_output = [inference_output]

        return [inference_output]

_service = NliTransformerHandler()

def handle(data, context):
    """   
    This function handles the requests for the model and returns a postprocessed response 
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None
        input_text = _service.preprocess(data)
        output = _service.inference(input_text)
        response = _service.postprocess(output, input_text)
        print(response)

        return response
    except Exception as e:
        raise e
