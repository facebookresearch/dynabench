# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
from settings import my_secret, my_model_no

# ================== Round 4 imports =================
try:
    from flint.data_utils.batchbuilder import move_to_device  # we might need this in the future if we want to use gpus.
    from nli.training import MODEL_CLASSES
    from nli.inspection_tools import get_lig_object, summarize_attributions, get_tokenized_input_tokens, \
        cleanup_tokenization_special_tokens, get_model_prediction
except Exception as error:
    print(" ".join(os.listdir("/home/model-server")))
    print(error)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print(exc_type, fname, exc_tb.tb_lineno)
    print(traceback.format_exc())
    quit()


get_model_class_name_by_model_no = {
    1: 'roberta-large',
    2: 'albert-xxlarge',
    3: 'xlnet-large',
    4: 'bart-large',
    5: 'electra-large',
}


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

        model_class_name = get_model_class_name_by_model_no[int(my_model_no)]

        model_checkpoint_path = model_pt_path

        args = Args(model_class_name)
        num_labels = 3

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        # TODO gpu is not supported, inspection might be time-consuming. It should be ok for now.
        device_num = -1
        model_class_item = MODEL_CLASSES[args.model_class_name]
        model_class_item['model_class_name'] = args.model_class_name
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

        # layer integrate gradient to get insight, if self.lig is None, then insight is not supported.
        self.lig = get_lig_object(self.model, self.model_class_item)

        self.initialized = True

    def preprocess(self, data):
        body = data[0]["body"]
        attribute_list = ["context", "hypothesis"]
        check_fields(body, attribute_list)

        # "target" needs to be provided for inspection b.c. gradient need to be calculate w.r.t. one specific label.
        # importance-values/attributes for input tokens will be different when given different labels.

        # when compute inspection,
        # (1). if we just want to inspect prediction, then we want the target to be the predicted label.
        # Then, that means we always need to do inference first to get the predicted label before inspection.
        # (2). if we want to use inspection to motivate MTurk to write the examples to be a pre-given label,
        # then we want to provide a target here in body["target"].

        # now, we get target from body.

        if "insight" not in body:
            body["insight"] = False
        if "target" not in body:
            body["target"] = 0

        context = body["context"]
        hypothesis = body["hypothesis"]
        insight = body["insight"]
        target = body["target"]

        tokenized_input_seq_pair = self.tokenizer.encode_plus(context, hypothesis,
                                                              max_length=self.max_length,
                                                              return_token_type_ids=True, truncation=True)

        input_ids = torch.Tensor(tokenized_input_seq_pair['input_ids']).long()
        ref_input_ids = torch.Tensor(
            [self.tokenizer.pad_token_id if token_id not in self.tokenizer.all_special_ids else token_id for token_id in
             input_ids.tolist()]).long()
        token_type_ids = torch.Tensor(tokenized_input_seq_pair['token_type_ids']).long()
        attention_mask = torch.Tensor(tokenized_input_seq_pair['attention_mask']).long()

        # we add the batch size dimension but it will always be 1.
        input_ids = input_ids.unsqueeze(0)
        ref_input_ids = ref_input_ids.unsqueeze(0)
        token_type_ids = token_type_ids.unsqueeze(0)
        attention_mask = attention_mask.unsqueeze(0)
        target_tensor = torch.tensor(target).long().unsqueeze(0)

        # note here: target:{entailment: 0, neural: 1, contradiction: 2}
        #
        # here we want to return a object with following fields:
        # (will be useful to pass to inference and inspect method)
        # {
        # "context": str        text version of premise

        # "hypothesis": str     text version of hypothesis

        # "insight": bool       whether we want the insight or not

        # "target":             target label to compute the gradient of the input tokens for inspection
        #                           (if not given then just set to 0)

        # "input_ids": torch.Tensor         the input word embedding indices to pass to the model
        #                                       shape: [batch_size (always 1) * embeddings size]

        # "ref_input_ids": torch.Tensor     the reference embedding indices to compute the

        # "token_type_ids" torch.Tensor     the token type id require by the model,
        #                                       remember that bart and distilbert don't have this field.

        # "attention_mask" torch.Tensor     attention mask required by the model
        # }

        preprocessed_item = {
            'context': context,
            'hypothesis': hypothesis,
            'insight': insight,
            'target': target,

            'target_tensor': target_tensor,
            'input_ids': input_ids,
            'ref_input_ids': ref_input_ids,
            'token_type_ids': token_type_ids,
            'attention_mask': attention_mask
        }

        return preprocessed_item

    def inspect(self, preprocessed_item):
        # if supported:     {"importance": importance, "words": tokens, "status": "finished"}
        # if not supported: {"importance": None, "words": None, "status": "not supported"}

        # self.lig is built in initialize()
        # if self.lig is None, then it means inspection is not support for the model
        if self.lig is None:
            response = {"importance": None, "words": None, "status": "not supported"}
            return [response]

        self.model.eval()

        # the following method will be called 100 times (by default) to compute integrate gradient for
        # both input token and reference tokens for comparision.
        # It might be time consuming if gpu is not support (5-10 secs).
        # get_model_prediction(preprocessed_item['input_ids'],
        #                       preprocessed_item['attention_mask'],
        #                       preprocessed_item['token_type_ids'],
        #                       self.model, self.model_class_name, True)
        attributions, delta = self.lig.attribute(inputs=preprocessed_item['input_ids'],
                                                 baselines=preprocessed_item['ref_input_ids'],
                                                 additional_forward_args=(
                                                     preprocessed_item['attention_mask'],
                                                     preprocessed_item['token_type_ids'],
                                                     self.model,
                                                     self.model_class_item,
                                                     True),
                                                 target=preprocessed_item['target_tensor'],
                                                 return_convergence_delta=True, n_steps=10)

        attributions_sum = summarize_attributions(attributions)
        token_ids = preprocessed_item['input_ids'][0].tolist()
        tokens = get_tokenized_input_tokens(self.tokenizer, token_ids)
        importance = attributions_sum.tolist()
        assert len(tokens) == len(importance)  # number of tokens should match number of importance values

        # TODO: do we need clean up special tokens or not (like "[seq], [cls], [s]")
        # note that the importance-values for special token will always be 0.
        # by default, I just set it to be True
        clean_up_special_tokens = False  # hard code for now.
        if clean_up_special_tokens:
            tokens, importance = cleanup_tokenization_special_tokens(tokens, importance, self.tokenizer)
        tokens = [remove_sp_chars(t) for t in tokens]
        response = {"importances": importance, "words": tokens, "status": "finished"}
        assert len(importance) == len(tokens)
        return [response]

    def inference(self, preprocessed_item, **kwargs):
        model_output = get_model_prediction(preprocessed_item['input_ids'],
                                            preprocessed_item['attention_mask'],
                                            preprocessed_item['token_type_ids'],
                                            self.model,
                                            self.model_class_item, with_gradient=False)
        # this return logits for entailment, neural and contradiction
        prob = torch.softmax(model_output, dim=-1)

        # convert torch tensor to python float list for JSON serialization.
        model_output = model_output[0].tolist()  # we do [0] because the first dimension is batch size
        prob = prob[0].tolist()
        result = {
            'logits': model_output,
            'prob': prob,
        }

        return result

    def postprocess(self, inference_output, data):
        """
        Post-processing of the model predictions to handle signature
        """
        inference_output, data = inference_output, data[0]["body"]
        data["s1"] = data["context"]
        data["s2"] = data["hypothesis"]
        # The input and the output probabilities are concatenated to generate signature
        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = remove_sp_chars(data["s1"])
        inference_output["s2"] = remove_sp_chars(data["s2"])
        inference_output["status"] = "finished"
        inference_output["model_name"] = self.model_name

        inference_output["signed"] = generate_response_signature(self.my_task_id, \
                                                                 self.my_round_id, my_secret, stringlist)
        logger.info(inference_output)
        logger.info(f"response before json '{inference_output}'")
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
        preprocessed_item = _service.preprocess(data)
        insight = preprocessed_item["insight"]
        if not insight:
            output = _service.inference(preprocessed_item)
            response = _service.postprocess(output, data)
        else:
            # Now if inspection is not supported by the model
            # the return value of the following call will just be
            # [{"importance": None, "words": None, "status": "not supported"}]
            # if inspection is supported, then the value is:
            # [{"importance": array of float, "words": array of str, "status": "finished"}]
            response = _service.inspect(preprocessed_item)

        logger.info(response)
        return response
    except AttributeError as e:
        raise e
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise e
