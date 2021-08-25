# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import os

import torch
from ts.torch_handler.base_handler import BaseHandler

from settings import my_secret
from shared import check_fields, generate_response_signature, handler_initialize
from utils import image_loader


try:
    from mmf.common.registry import registry
    from mmf.common.sample import SampleList
    from mmf.models.movie_mcan import MoVieMcan
    from mmf.utils.build import build_processors
    from mmf.utils.configuration import load_yaml
except ImportError:
    raise RuntimeError("Please install MMF first to use this handler")


logger = logging.getLogger(__name__)


class MMFMovieMcanVQAHandler(BaseHandler):
    """
    Transformers handler class for question answering
    """

    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, ctx):
        """
        Initializes the model and tokenizer during server start up
        """
        model_dir, _, self.device, self.setup_config = handler_initialize(ctx)

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        if os.path.isfile(os.path.join(model_dir, "config.yaml")):
            mmf_config = load_yaml(os.path.join(model_dir, "config.yaml"))
            vqa2_processors = mmf_config.dataset_config.vqa2.processors
            vqa2_processors.text_processor.params.vocab.vocab_file = os.path.join(
                model_dir, "vocabulary_100k.txt"
            )
            vqa2_processors.answer_processor.params.vocab_file = os.path.join(
                model_dir, "answers_vqa.txt"
            )
            self.processors = build_processors(vqa2_processors)

            logger.info("Processors initialized")
            registry.register("vqa2_text_processor", self.processors["text_processor"])
            registry.register(
                "vqa2_num_final_outputs",
                self.processors["answer_processor"].get_vocab_size(),
            )
            logger.warning("Loading trained model")

            self.model = MoVieMcan.from_pretrained(model_dir)
        else:
            raise FileNotFoundError("Missing model-specific config.yaml file")

        self.model.to(self.device)
        self.model.eval()
        logger.debug(f"MMF model from path {model_dir} loaded successfully")

        self.initialized = True

    def preprocess(self, data):
        """
        Basic text preprocessing
        """
        logger.info("In preprocess, data's value: '%s'", data)
        body = data[0]["body"]
        if not body:
            raise AttributeError("No body found in the request")
        # Checks if the request contains the necessary attributes
        # TODO: insight not implemented, maybe later
        attribute_list = ["question", "image_url", "insight"]
        check_fields(body, attribute_list)

        question = body["question"]
        image_url = body["image_url"]
        insight = body["insight"]
        logger.info("In preprocess, question's value: '%s'", question)
        logger.info("In preprocess, image_url's value: '%s'", image_url)

        example = {"image_url": image_url.strip(), "question": question.strip()}

        return example, insight

    def inspect(self, example):
        # NOTE: Not implemented as of now
        return []

    def inference(self, example):
        """
        Predict the answer for the question and image using the serialized
        MMF checkpoint.
        """

        def to_list(tensor):
            return tensor.detach().cpu().tolist()

        # Handling inference for question answering
        self.model.eval()
        with torch.no_grad():
            text = example["question"]
            image_url = example["image_url"]
            image = image_loader(image_url)
            processed_input = {}
            processed_input.update(self.processors["image_processor"]({"image": image}))
            processed_input.update(self.processors["text_processor"]({"text": text}))
            sample_list = SampleList([processed_input])

            outputs = self.model(sample_list)
            max_ind = outputs["scores"].argmax()
            max_prob = outputs["scores"].max()
            predictions = {
                "model_conf": max_prob.item(),
                "answer": self.processors["answer_processor"].idx2word(max_ind),
            }
            logger.info("predictions at the end of inference %s", predictions)
            return predictions

    def postprocess(self, predictions, example):
        """
        Post-processing of the model predictions to handle signature
        """
        contx = example["image_url"]
        data = example["question"]
        response = {}

        logger.info("response without sign '%s'", response)
        response["answer"] = predictions["answer"]
        response["prob"] = max(0.0, min(1.0, predictions["model_conf"]))

        # The inputs are concatenated to generate signature
        stringlist = [
            str(response["answer"]) + "|" + str(response["prob"]),
            contx,
            data,
        ]
        # pred_str = '|'.join(str(x) for x in response["prediction"])
        # stringlist = [pred_str,data,contx]

        response["signed"] = generate_response_signature(
            self.my_task_id, self.my_round_id, my_secret, stringlist
        )
        logger.info("response before return '%s'", response)

        return [response]


_service = MMFMovieMcanVQAHandler()


def handle(data, context):
    """
    This function handles the requests for the model and returns
    a postprocessed response
    #sample input {
      "answer": "pretend you are reviewing a place",
      "context": "Please pretend you are reviewing a place, product, book or movie",
      "hypothesis": "What should i pretend?",
      "insight": true
    } and output response is probabilities
    """
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        example, insight = _service.preprocess(data)
        if not insight:
            predictions = _service.inference(example)
            response = _service.postprocess(predictions, example)
            return response
        else:
            response = _service.inspect(example)
            return response

    except Exception as e:
        raise e
