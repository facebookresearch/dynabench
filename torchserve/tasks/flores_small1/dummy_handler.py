# Copyright (c) Facebook, Inc. and its affiliates.

"""
Instructions:
Please work through this file to construct your handler. Here are things
to watch out for:
- TODO blocks: you need to fill or modify these according to the instructions.
   The code in these blocks are for demo purpose only and they may not work.
- NOTE inline comments: remember to follow these instructions to pass the test.
"""

import json
import logging
from pathlib import Path

from dynalab.handler.base_handler import BaseDynaHandler
from dynalab.tasks.flores_small1 import TaskIO


logger = logging.getLogger("flores.dummy")


class Handler(BaseDynaHandler):
    def initialize(self, context):
        """
        load model and extra files
        """
        model_pt_path, model_file_dir, device = self._handler_initialize(context)

        # ############TODO 1: Initialize model ############
        """
        Load model and read relevant files here.
        """
        self.translations = json.loads(Path(model_pt_path).read_text())
        # #################################################
        self.taskIO = TaskIO()
        self.initialized = True
        logger.info(f"Setup Handler {__file__}")

    def preprocess(self, data):
        """
        preprocess data into a format that the model can do inference on
        """
        example = self._read_data(data)

        # ############TODO 2: preprocess data #############
        """
        You can extract the key and values from the input data like below
        example is a always json object. Yo can see what an example looks like by
        ```
        dynalab.tasks.{your_task}.TaskIO().get_input_json()
        ```
        """
        return example

    def inference(self, input_data):
        """
        do inference on the processed example
        """

        src = input_data["source_language"]
        translation = self.translations.get(src, input_data["source_text"])
        return translation

    def postprocess(self, inference_output, data):
        """
        post process inference output into a response.
        response should be a single element list of a json
        the response format will need to pass the validation in
        ```
        dynalab.tasks.{your_task}.TaskIO().verify_response(response)
        ```
        """
        example = self._read_data(data)
        response = {
            "id": example["uid"],
            "source_language": example["source_language"],
            "source_text": example["source_text"],
            "target_language": example["target_language"],
            "translated_text": inference_output,
        }

        # #################################################
        response = self.taskIO.sign_response(response, example)
        return [response]


_service = Handler()


def handle(data, context):
    if not _service.initialized:
        _service.initialize(context)
    if data is None:
        return None

    # ############TODO 5: assemble inference pipeline #####
    """
    Normally you don't need to change anything in this block.
    However, if you do need to change this part (e.g. function name, argument, etc.),
    remember to make corresponding changes in the Handler class definition.
    """
    logger.info(f"Received query {_service._read_data(data)}")
    input_data = _service.preprocess(data)
    logger.info(f"preprocessed to {input_data}")
    output = _service.inference(input_data)
    logger.info(f"outputted {output}")
    response = _service.postprocess(output, data)
    logger.info(f"responding {response}")
    # #####################################################

    return response
