""" 
This is a handler passed to the torchserve to serve the model. 
It loads up the model and handles requests. This code is specific for NLI round 2
"""

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

from allennlp.data.iterators import BasicIterator
from allennlp.nn.util import move_to_device

import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
from settings import my_secret
from TransformerUtils import generate_response_signature, check_fields, remove_sp_chars, handler_initialize

# ================== Round 2 imports =================
from data_utils.exvocab import ExVocabulary
from roberta_model.nli_training import RoBertaSeqClassification
from data_utils.readers.roberta_nli_reader import RoBertaNLIReader
from fairseq.models.roberta import RobertaModel

class NliTransformerHandler(BaseHandler):
    """
    Transformers handler class for NLI.
    """

    def __init__(self):
        super(NliTransformerHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        """
        Initializes the model and tokenizer during server start up 
        """
        model_dir, model_pt_path, self.device, self.setup_config \
                  = handler_initialize(self,ctx)

        ## NLI Custom codes
        self.input_list = True
        device_num = -1
        self.model_name = "roberta_1"

        # Setup Model
        self.roberta_model_name = self.setup_config["model_name"]
        max_input_l = self.setup_config["max_length"]
        num_labels = self.setup_config["num_labels"]
        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]
        self.device_num = device_num

        logger.info("--------------- Stage 1 ------------------- ")
        self.cur_roberta = torch.hub.load("pytorch/fairseq", self.roberta_model_name)
        # self.cur_roberta = RobertaModel.from_pretrained(model_dir, checkpoint_file='model.pt')
        self.model = RoBertaSeqClassification(self.cur_roberta, num_labels=num_labels)
        logger.info("The Roberta classification created")

        logger.info("--------------- Stage 2 ------------------- ")
        if torch.cuda.is_available() and device_num != -1:
            self.model.load_state_dict(torch.load(model_pt_path))
        else:
            self.model.load_state_dict(torch.load(model_pt_path, map_location="cpu"))

        logger.info("The state_dict loaded")
        self.model.to(self.device)

        logger.info("--------------- Stage 3 ------------------- ")
        self.cs_reader = RoBertaNLIReader(self.cur_roberta, lazy=False, example_filter=None, \
            max_seq_l=max_input_l)
        logger.info("The RoBertaNLIReader created")

        logger.info("--------------- Stage 4 ------------------- ")
        unk_token_num = {"tokens": 1}  # work around for initiating vocabulary.
        vocab = ExVocabulary(unk_token_num=unk_token_num)
        vocab.add_token_to_namespace("e", namespace="labels")
        vocab.add_token_to_namespace("n", namespace="labels")
        vocab.add_token_to_namespace("c", namespace="labels")
        vocab.add_token_to_namespace("h", namespace="labels")
        vocab.change_token_with_index_to_namespace("h", -2, namespace="labels")
        self.biterator = BasicIterator(batch_size=32)
        self.biterator.index_with(vocab)
        logger.info("--------------- Stage 5 ------------------- ")
        self.initialized = True

    def preprocess(self, data):
        """ 
        Basic text preprocessing, based on the user's chocie of application mode.
        """
        logger.info("--------------- Preprocess satge 1 ------------------- ")
        logger.info(f"In preprocess, Recieved data '{data}'")
        body = data[0]["body"]
        if not body:
            raise AttributeError("No 'body' found in the request") 
        # Checks if the request contains the necessary attributes
        attribute_list = ["context", "hypothesis", "insight"]
        check_fields(body, attribute_list)

        context_decoded = remove_sp_chars(body["context"])
        hypothesis_decoded = remove_sp_chars(body["hypothesis"])

        example = {"s1": context_decoded, "s2": hypothesis_decoded}
        example["y"] = "h"
        example["uid"] = str(uuid.uuid4())
        logger.info(f"In preprocess , example: '{example}'")

        return example

    def inference(self, examples):
        """ 
        Predict the class (or classes) of the received text using the serialized 
        transformers checkpoint.
        """
        start_time = time.time()
        logger.info("----------------- Inference -------------------")
        self.input_list = True  # if input is list, we return list, else we return instance.
        if not isinstance(examples, list):
            self.input_list = False
            examples = [examples]

        logger.info(f"----------------- Inference ------------------- {examples}")

        instances = self.cs_reader.read(examples)
        logger.info(f"In inference, instances '{instances}'")

        data_iter = self.biterator(instances, num_epochs=1, shuffle=True)
        logger.info(f"In inference, e_iter data '{data_iter}'")

        with_probs = True
        make_int = False
        model = self.model

        id2label = {0: "e", 1: "n", 2: "c"}

        # logger.info("Evaluating ...")
        with torch.no_grad():
            model.eval()
            total_size = 0

            y_pred_list = []
            y_fid_list = []
            y_pid_list = []
            y_element_list = []

            y_logits_list = []
            y_probs_list = []

            for batch_idx, batch in enumerate(data_iter):
                batch = move_to_device(batch, self.device_num)

                eval_paired_sequence = batch["paired_sequence"]
                eval_paired_segments_ids = batch["paired_segments_ids"]
                eval_labels_ids = batch["label"]
                eval_att_mask = batch["paired_mask"]
                output = model(input_ids=eval_paired_sequence, attention_mask=eval_att_mask,\
                     token_type_ids=eval_paired_segments_ids, mode=RoBertaSeqClassification.ForwardMode.EVAL)
                # We give label is None then the first output is logits
                out = output

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
        logger.info(f"inference time --------------- {(time.time() - start_time)}\
             seconds  ----------------")
        logger.info(f"----------------- Inference returns ------------------- \
            {result_items_list}")
        return result_items_list

    def postprocess(self, inference_output, data):
        """ 
        Post-processing of the model predictions to handle signature 
        """

        inference_output = inference_output[0]
        
        # The input and the output probabilities are concatenated to generate signature
        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = data["s1"]
        inference_output["s2"] = data["s2"]
        inference_output["y"] = data["y"]
        inference_output["status"] = "finished"
        inference_output["model_name"] = self.model_name

        inference_output["signed"] = generate_response_signature(self.my_task_id, \
            self.my_round_id, my_secret, stringlist)
        logger.info(inference_output)
        logger.info(f"response before json '{inference_output}'" )

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
        "target": [1,0,0]
    } and output response is probabilities
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None
        input_text = _service.preprocess(data)
        output = _service.inference(input_text)
        response = _service.postprocess(output, input_text)
        logger.info(response)

        return response
    except AttributeError as e:
        raise e
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise e
