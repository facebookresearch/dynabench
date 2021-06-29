# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import os
import random
import time


import torch  # noqa  # isort:skip
from fairseq.models.transformer import TransformerModel  # noqa  # isort:skip
from ts.torch_handler.base_handler import BaseHandler  # noqa  # isort:skip

from cache import Cache  # noqa  # isort:skip
from settings import my_secret  # noqa  # isort:skip
from shared import (  # noqa  # isort:skip
    check_fields,  # noqa  # isort:skip
    generate_response_signature,  # noqa  # isort:skip
    handler_initialize,  # noqa  # isort:skip
)  # noqa  # isort:skip


logger = logging.getLogger(__name__)


SPECIAL_TOKENS = {"bos_token": "<s>", "eos_token": "</s>", "sep_token": "</s>"}
DEFAULT_BEAM_SIZE = 5


class TransformerGeneratorHandler(BaseHandler):
    """
    Handler class for generating questions using a Fairseq transformers model
    """

    def __init__(self):
        super().__init__()
        self.initialized = False

    def _read_data(self, data):
        return data[0]["body"]

    def initialize(self, ctx):
        """
        Initializes the model and tokenizer during server start up
        """
        model_dir, model_pt_path, self.device, self.setup_config = handler_initialize(
            ctx
        )

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        """ Loading the model and tokenizer from checkpoint and config files based on
        the user's choice of mode further setup config can be added."""
        if self.setup_config["save_mode"] == "torchscript":
            logger.warning("Loading torchscript model")
            self.model = torch.jit.load(model_pt_path)
        elif self.setup_config["save_mode"] == "pretrained":
            logger.warning(f"Loading trained model from {model_dir}")
            self.model = TransformerModel.from_pretrained(
                model_name_or_path=model_dir,
                checkpoint_file="checkpoint_best.pt",
                bpe="gpt2",
                fp16=True,
                beam=DEFAULT_BEAM_SIZE,
                sampling=True,
                sampling_topp=0.75,
            )

            cache_path = os.path.join(model_dir, "cache.json")
            logger.warning(f"Loading cache from {cache_path}")
            self.cache = Cache(cache_path)

        self.model.to(self.device)
        logger.debug(
            f"Fairseq transformer model from path {model_dir} loaded successfully"
        )
        self.initialized = True

    def preprocess(self, data):
        """
        Preprocess data into a format that the model can do inference on.
        """
        logger.info("In preprocess, data's value: '%s'", data)
        example = self._read_data(data)
        if not example:
            raise AttributeError("No body found in the request")
        # Checks if the request contains the necessary attributes
        attribute_list = ["answer", "context"]
        check_fields(example, attribute_list)

        context = example["context"].strip()
        answer = example["answer"].strip()
        min_q_index = int(example.get("hypothesis", -1))
        filter_mode = example.get("statement", "")

        generate_batch_size = 5
        threshold_adversarial = 0.4
        threshold_uncertain = 0.4
        additional_args = example.get("insight", "")
        if isinstance(additional_args, str):
            additional_args = additional_args.split("|")
            if len(additional_args) > 0:
                generate_batch_size = int(additional_args[0])
            if len(additional_args) > 1:
                threshold_adversarial = float(additional_args[1])
            if len(additional_args) > 2:
                threshold_uncertain = float(additional_args[2])

        example = {
            "context": context,
            "answer": answer,
            "min_q_index": min_q_index,
            "filter_mode": filter_mode,
            "generate_batch_size": generate_batch_size,
            "threshold_adversarial": threshold_adversarial,
            "threshold_uncertain": threshold_uncertain,
        }
        logger.info("In preprocess, example's value: '%s'", example)
        return example

    def inference(self, example):
        """
        Run model using the pre-processed data.
        """

        def convert_example_to_input(example):
            ex_input_inner = f" {SPECIAL_TOKENS['sep_token']} ".join(example)
            ex_input = [
                SPECIAL_TOKENS["bos_token"],
                ex_input_inner,
                SPECIAL_TOKENS["eos_token"],
            ]
            ex_input = " ".join(ex_input)
            return ex_input

        def clean_special_tokens(text):
            for _, special_tok in SPECIAL_TOKENS.items():
                text = text.replace(special_tok, "")
            return text.strip()

        result = dict()
        # Check if we have example in cache
        cache_result = self.cache.get(
            context=example["context"],
            answer=example["answer"],
            min_q_index=example["min_q_index"],
            filter_mode=example["filter_mode"],
            threshold_adversarial=example["threshold_adversarial"],
            threshold_uncertain=example["threshold_uncertain"],
        )
        logging.info(f"Cache result: {cache_result}")
        if cache_result:
            result["questions"] = [cache_result["q"]]
            result["question_cache_id"] = cache_result["q_index"]
            result["question_type"] = "cache"
            # Introduce a random delay
            time.sleep(0.2 + random.random())

        else:
            # Prepare the example for querying the model
            ex_input = [example["answer"], example["context"]]
            ex_input = convert_example_to_input(ex_input)
            ex_inputs = [ex_input]
            if example["filter_mode"] != "":
                ex_inputs *= example["generate_batch_size"]

            logging.info(
                f"Example Input: {ex_input} generating {len(ex_inputs)} examples."
            )

            output = self.model.translate(
                ex_inputs, beam=max(DEFAULT_BEAM_SIZE, example["generate_batch_size"])
            )
            if isinstance(output, str):
                clean_output = clean_special_tokens(output)
            else:
                clean_output = [clean_special_tokens(q) for q in output]
            logging.info(f"Example Output: {clean_output}")

            result["questions"] = clean_output
            result["question_cache_id"] = -1
            result["question_type"] = "generated"

        return result

    def postprocess(self, inference_output, data):
        """
        Post process inference output into a response.
        """

        response = inference_output
        example = self._read_data(data)

        signature_list = [
            "|".join(response["questions"]),
            str(example["context"]),
            str(example["answer"]),
            str(response["question_cache_id"]),
            str(response["question_type"]),
        ]
        logging.info("Generating signature")
        response["signed"] = generate_response_signature(
            self.my_task_id, self.my_round_id, my_secret, signature_list
        )
        logger.info("Response before return '%s'", response)

        return [response]


_service = TransformerGeneratorHandler()


def handle(data, context):
    """
    This function handles the requests for the model and returns a
    postprocessed response
    #sample input {
        "context": "Please pretend you are reviewing a place, product, book or movie",
        "answer": "pretend you are reviewing a place",
        } and output response
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        input_data = _service.preprocess(data)
        output = _service.inference(input_data)
        response = _service.postprocess(output, data)
        return response

    except Exception as e:
        raise e
