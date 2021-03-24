# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import sys

import torch
import torch.nn.functional as F
import uuid
from captum.attr import LayerIntegratedGradients
from ts.torch_handler.base_handler import BaseHandler

from allennlp.data.iterators import BasicIterator
from data_utils.exvocab import ExVocabulary
from data_utils.readers.roberta_nli_reader import RoBertaNLIReader
from roberta_model.nli_training import RoBertaSeqClassification
from settings import my_secret
from shared import (
    captum_nli_forward_func,
    check_fields,
    generate_response_signature,
    get_nli_word_token,
    handler_initialize,
    remove_sp_chars,
    summarize_attributions,
)


logger = logging.getLogger(__name__)
sys.path.append("/home/model-server/anli/src")


class NliTransformerHandler(BaseHandler):
    """
    Transformers handler class for NLI.
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

        # NLI Custom codes
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
        # self.cur_roberta = RobertaModel.from_pretrained(
        #   model_dir, checkpoint_file='model.pt'
        # )
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
        self.cs_reader = RoBertaNLIReader(
            self.cur_roberta, lazy=False, example_filter=None, max_seq_l=max_input_l
        )
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
        # -------------------- Captum initialization ------------------#
        self.lig = LayerIntegratedGradients(
            captum_nli_forward_func,
            self.model.roberta.model.decoder.sentence_encoder.embed_tokens,
        )
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

        context = body["context"]
        hypothesis = body["hypothesis"]
        insight = body["insight"]
        target = 0
        if insight:
            target = body["target"]
        example = {"s1": context.strip(), "s2": hypothesis.strip()}
        example["y"] = "h"
        example["uid"] = str(uuid.uuid4())
        # logger.info(f"In preprocess , example: '{example}'")
        # Generate tokens
        input_ids = self.cs_reader.read([example])[0]
        paired_sequence = (
            torch.Tensor(input_ids["paired_sequence"].array).long().unsqueeze(0)
        )
        paired_segments_ids = (
            torch.Tensor(input_ids["paired_segments_ids"].array).long().unsqueeze(0)
        )
        attention_mask = (
            torch.Tensor(input_ids["paired_mask"].array).long().unsqueeze(0)
        )

        return (
            input_ids,
            example,
            insight,
            target,
            paired_sequence,
            paired_segments_ids,
            attention_mask,
        )

    def inference(
        self, paired_sequence, paired_segments_ids, attention_mask, input_ids
    ):
        """Predict the class (or classes) of the received text using the
        serialized transformers checkpoint.
        """
        id2label = {0: "e", 1: "n", 2: "c"}
        self.model.eval()
        output = self.model(
            input_ids=paired_sequence,
            attention_mask=attention_mask,
            token_type_ids=paired_segments_ids,
            mode=RoBertaSeqClassification.ForwardMode.EVAL,
        )

        result = dict()
        result["uid"] = input_ids["uid"].metadata
        result["fid"] = input_ids["fid"].metadata
        result["element"] = input_ids["item"].metadata
        result["predicted_label"] = id2label[int(torch.max(output, 1)[1])]
        result["logits"] = output.tolist()
        result["prob"] = F.softmax(output, dim=1).squeeze(0).tolist()

        print("----------------- Inference returns -------------------", result)
        return result

    def postprocess(self, inference_output, data):
        """
        Post-processing of the model predictions to handle signature
        """
        # The input and the output probabilities are concatenated to generate
        # signature
        pred_str = "|".join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str, data["s1"], data["s2"]]

        inference_output["s1"] = remove_sp_chars(data["s1"])
        inference_output["s2"] = remove_sp_chars(data["s2"])
        inference_output["y"] = data["y"]
        inference_output["status"] = "finished"
        inference_output["model_name"] = self.model_name

        inference_output["signed"] = generate_response_signature(
            self.my_task_id, self.my_round_id, my_secret, stringlist
        )
        logger.info(inference_output)
        logger.info(f"response before json '{inference_output}'")
        return [inference_output]


_service = NliTransformerHandler()


def get_insights(
    paired_sequence, paired_segments_ids, attention_mask, target, _service
):
    """
    This function calls the layer integrated gradient to get word importance
    of the input text
    """
    ref_input_ids = torch.Tensor(
        [
            1 if token_id not in [0, 2] else token_id
            for token_id in paired_sequence.tolist()
        ]
    )
    ref_input_ids = ref_input_ids.long().unsqueeze(0)
    all_tokens = get_nli_word_token(paired_sequence, _service.cur_roberta)
    attributions, delta = _service.lig.attribute(
        inputs=paired_sequence,
        baselines=ref_input_ids,
        additional_forward_args=(
            attention_mask,
            paired_segments_ids,
            _service.model,
            RoBertaSeqClassification.ForwardMode.EVAL,
        ),
        target=target,
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
        (
            input_ids,
            input_text,
            insight,
            target,
            paired_sequence,
            paired_segments_ids,
            attention_mask,
        ) = _service.preprocess(data)
        if insight:
            response = get_insights(
                paired_sequence, paired_segments_ids, attention_mask, target, _service
            )
        else:
            output = _service.inference(
                paired_sequence, paired_segments_ids, attention_mask, input_ids
            )
            response = _service.postprocess(output, input_text)
        logger.info(response)

        return response
    except AttributeError as e:
        raise e
    except FileNotFoundError as e:
        raise e
    except Exception as e:
        raise e
