# Copyright (c) Facebook, Inc. and its affiliates.

import logging
import os

import torch
from captum.attr import LayerIntegratedGradients
from torch.utils.data import DataLoader, SequentialSampler
from transformers import AutoConfig, AutoModelForQuestionAnswering, AutoTokenizer
from transformers.data.metrics.squad_metrics import compute_exact, compute_f1
from transformers.data.processors.squad import (
    SquadResult,
    squad_convert_examples_to_features,
)
from ts.torch_handler.base_handler import BaseHandler

from qa_utils import compute_predictions_logits, convert_to_squad_example
from settings import my_secret
from shared import (
    captum_qa_forward,
    check_fields,
    construct_input_ref_pair,
    generate_response_signature,
    get_n_steps_for_interpretability,
    get_word_token,
    handler_initialize,
    summarize_attributions,
)


logger = logging.getLogger(__name__)


THRESHOLD_F1 = 0.4
QA_CONFIG = {
    "max_seq_length": 512,
    "max_query_length": 64,
    "max_answer_length": 200,
    "do_lower_case": False,
    "doc_stride": 128,
    "eval_batch_size": 8,
    "n_best_size": 1,
    "n_best_per_passage_size": 1,
}


class TransformersQAHandler(BaseHandler):
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
            if os.path.isfile(os.path.join(model_dir, "config.json")):
                logger.warning("Loading trained model")
                config = AutoConfig.from_pretrained(model_dir)
                self.model = AutoModelForQuestionAnswering.from_pretrained(
                    model_dir, config=config
                )
            else:
                raise FileNotFoundError("Missing model-specific config.json file")

        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
        logger.info("Tokenizer initialized")

        self.model.to(self.device)
        self.model.eval()
        logger.debug(f"Transformer model from path {model_dir} loaded successfully")

        # ------------------- Captum initialization --------------------#
        self.lig = LayerIntegratedGradients(
            captum_qa_forward,
            getattr(self.model, self.model.base_model_prefix).embeddings,
        )
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
        attribute_list = ["answer", "context", "hypothesis", "insight"]
        check_fields(body, attribute_list)

        if "compute_end_importances" not in body:
            body["compute_end_importances"] = False

        passage = body["context"]
        question = body["hypothesis"]
        answer = body["answer"]
        insight = body["insight"]
        compute_end_importances = body["compute_end_importances"]
        logger.info("In preprocess, body's value: '%s'", body)
        logger.info("In preprocess, passage's value: '%s'", passage)
        logger.info("In preprocess, questions's value: '%s'", question)
        logger.info("In preprocess, answer's value: '%s'", answer)

        example = {"passage": passage.strip(), "question": question.strip()}

        return [example], answer, insight, compute_end_importances

    def inspect(self, example, compute_end_importances):
        """
        This function calls the layer integrated gradient to get word importance
        of the question and the passage. The word importance is obtained for
        start and end position of the predicted answer
        """
        if self.lig is None:
            response = {"start_importances": [], "words": [], "status": "not supported"}
            return [response]

        input_ids, ref_input_ids, attention_mask = construct_input_ref_pair(
            example[0]["question"], example[0]["passage"], self.tokenizer, self.device
        )
        all_tokens = get_word_token(input_ids, self.tokenizer)
        n_steps = get_n_steps_for_interpretability(
            n_tokens=len(all_tokens), max_n_steps=8
        )
        logger.info("Word Tokens = '%s'", all_tokens)

        position_qa_model = 0
        attributions_start, delta_start = self.lig.attribute(
            inputs=input_ids,
            baselines=ref_input_ids,
            additional_forward_args=(attention_mask, position_qa_model, self.model),
            return_convergence_delta=True,
            n_steps=n_steps,
        )
        attributions_start_sum = summarize_attributions(attributions_start).tolist()

        attributions_end_sum = []
        if compute_end_importances:
            position_qa_model = 1
            attributions_end, delta_end = self.lig.attribute(
                inputs=input_ids,
                baselines=ref_input_ids,
                additional_forward_args=(attention_mask, position_qa_model, self.model),
                return_convergence_delta=True,
                n_steps=n_steps,
            )
            attributions_end_sum = summarize_attributions(attributions_end).tolist()

        response = {}
        response["start_importances"] = attributions_start_sum
        response["end_importances"] = attributions_end_sum
        response["words"] = all_tokens
        return [response]

    def inference(self, examples):
        """
        Predict the class (or classes) of the received text using the serialized
        transformers checkpoint.
        """

        def to_list(tensor):
            return tensor.detach().cpu().tolist()

        # Handling inference for question answering
        self.model.eval()
        with torch.no_grad():
            # Convert all to SQuAD Examples
            examples = [
                convert_to_squad_example(passage=ex["passage"], question=ex["question"])
                for ex in examples
            ]

            print("The examples after convert_to_squad", examples)
            # Featurise the examples
            features, dataset = squad_convert_examples_to_features(
                examples=examples,
                tokenizer=self.tokenizer,
                max_seq_length=QA_CONFIG["max_seq_length"],
                doc_stride=QA_CONFIG["doc_stride"],
                max_query_length=QA_CONFIG["max_query_length"],
                is_training=False,
                return_dataset="pt",
            )

            eval_sampler = SequentialSampler(dataset)
            eval_dataloader = DataLoader(
                dataset, sampler=eval_sampler, batch_size=QA_CONFIG["eval_batch_size"]
            )

            all_results = []
            predictions = {}

            for batch in eval_dataloader:
                inputs = {"input_ids": batch[0], "attention_mask": batch[1]}
                example_indices = batch[3]
                outputs = self.model(**inputs)

                for i, example_index in enumerate(example_indices):
                    eval_feature = features[example_index.item()]
                    unique_id = int(eval_feature.unique_id)

                    output = [to_list(output[i]) for output in outputs]

                    start_logits, end_logits = output
                    result = SquadResult(unique_id, start_logits, end_logits)

                    all_results.append(result)

                batch_predictions = compute_predictions_logits(
                    examples,
                    features,
                    all_results,
                    QA_CONFIG["n_best_per_passage_size"],
                    QA_CONFIG["max_answer_length"],
                    QA_CONFIG["do_lower_case"],
                    None,
                    None,
                    None,
                    False,
                    False,
                    0.0,
                    self.tokenizer,
                )
                predictions.update(batch_predictions)

            predictions_by_examples = [predictions[ex.qas_id] for ex in examples]
            predictions_by_example = predictions_by_examples[0]
            logger.info(
                "predictions_by_example at the end of inference %s",
                predictions_by_example,
            )
            return predictions_by_example

    def postprocess(self, predictions_by_example, example, answer):
        """
        Post-processing of the model predictions to handle signature
        """
        contx = example[0]["passage"]
        data = example[0]["question"]
        response = {}

        logger.info("response without sign '%s'", response)
        response["text"] = predictions_by_example["text"]
        response["prob"] = max(0.0, min(1.0, predictions_by_example["model_conf"]))
        # this is what the frontend expects

        # Evaluate the model prediction against the human answer
        human_ans = str(answer).strip()
        response["eval_f1"] = compute_f1(human_ans, response["text"])
        response["eval_exact"] = compute_exact(human_ans, response["text"])
        response["model_is_correct"] = response["eval_f1"] > THRESHOLD_F1

        # The inputs are concatenated to generate signature
        stringlist = [
            str(response["model_is_correct"]) + "|" + str(response["text"]),
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


_service = TransformersQAHandler()


def handle(data, context):
    """
    This function handles the requests for the model and returns a
    postprocessed response
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

        example, answer, insight, compute_end_importances = _service.preprocess(data)
        if not insight:
            predictions_by_example = _service.inference(example)
            response = _service.postprocess(predictions_by_example, example, answer)
            return response
        else:
            response = _service.inspect(example, compute_end_importances)
            return response

    except Exception as e:
        raise e
