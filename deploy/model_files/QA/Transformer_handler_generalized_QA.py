# This handler creates the server using torchserve
from abc import ABC
import json
import logging
import os
import ast
import torch
from transformers import AutoConfig,AutoModelForSequenceClassification, AutoTokenizer, AutoModelForQuestionAnswering,AutoModelForTokenClassification,RobertaForSequenceClassification, RobertaTokenizer
import hashlib
import json
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
from settings import my_secret,my_task_id,my_round_id
#QA specific libraries
from qa_utils import convert_to_squad_example, compute_predictions_logits
from transformers.data.processors.squad import squad_convert_examples_to_features, SquadResult
from torch.utils.data import DataLoader, SequentialSampler
from transformers.data.metrics.squad_metrics import compute_f1, compute_exact

logger = logging.getLogger(__name__)

THRESHOLD_F1 = 0.4
QA_CONFIG = {
    'max_seq_length': 512,
    'max_query_length': 64,
    'max_answer_length': 30,
    'do_lower_case': False,
    'doc_stride': 128,
    'eval_batch_size': 8,
    'n_best_size': 1,
    'n_best_per_passage_size': 1
}


class TransformersSeqClassifierHandler(BaseHandler, ABC):
    """
    Transformers handler class for sequence classification
    """
    def __init__(self):
        super(TransformersSeqClassifierHandler, self).__init__()
        self.initialized = False

    def initialize(self, ctx):
        self.manifest = ctx.manifest
        properties = ctx.system_properties
        model_dir = properties.get("model_dir")
        serialized_file = self.manifest['model']['serializedFile']
        model_pt_path = os.path.join(model_dir, serialized_file)
        self.device = torch.device("cuda:" + str(properties.get("gpu_id")) if torch.cuda.is_available() else "cpu")
        #read configs for the mode, model_name, etc. from setup_config.json
        setup_config_path = os.path.join(model_dir, "setup_config.json")

        if os.path.isfile(setup_config_path):
            with open(setup_config_path) as setup_config_file:
                self.setup_config = json.load(setup_config_file)
        else:
            logger.warning('Missing the setup_config.json file.')

        #Loading the model and tokenizer from checkpoint and config files based on the user's choice of mode
        #further setup config can be added.
        if self.setup_config["save_mode"] == "torchscript":
            logger.warning('Loading torchscript model')
            self.model = torch.jit.load(model_pt_path)
        elif self.setup_config["save_mode"] == "pretrained":
            logger.warning('Loading pretrained model')
            if self.setup_config["mode"]== "sequence_classification":
                if os.path.isfile(os.path.join(model_dir, "config.json")):
                    config = AutoConfig.from_pretrained(
                                                    model_dir)
                    self.model = AutoModelForSequenceClassification.from_pretrained(model_dir,config = config)
            elif self.setup_config["mode"]== "question_answering":
                config = AutoConfig.from_pretrained(model_dir)
                self.model = AutoModelForQuestionAnswering.from_pretrained(
                model_dir,
                config=config)
            else:
                logger.warning('Missing the checkpoint or state_dict.')

        if not os.path.isfile(os.path.join(model_dir, "vocab.json")):
            self.tokenizer = RobertaTokenizer.from_pretrained('roberta-base')
            logger.info("Using default vocab")
        else:
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
            logger.info("Using provided vocab")
        self.model.to(self.device)
        self.model.eval()
        logger.debug('Transformer model from path {0} loaded successfully'.format(model_dir))
        self.initialized = True

    def preprocess(self, data):
        """ Basic text preprocessing"""
        max_length = self.setup_config["max_length"]
        logger.info("In preprocess, data's value: '%s'",data)
        body = data[0].get("body")

        passage = body.get("context")
        question = body.get("hypothesis")
        answer = body.get("answer")
        logger.info("In preprocess, body's value: '%s'",body)
        logger.info("In preprocess, passage's value: '%s'",passage)
        logger.info("In preprocess, questions's value: '%s'",question)
        logger.info("In preprocess, answer's value: '%s'",answer)      

        example = {
            'passage': passage.strip(),
            'question': question.strip()
        }

        return [example],answer

    def inference(self, examples):
        """ Predict the class (or classes) of the received text using the serialized transformers checkpoint."""
        # Handling inference for sequence_classification.
        self.model.eval()
        with torch.no_grad():
            # Convert all to SQuAD Examples
            examples = [convert_to_squad_example(passage=ex['passage'], question=ex['question']) for ex in examples]

            print("The examples after convert_to_squad", examples)
            # Featurise the examples
            features, dataset = squad_convert_examples_to_features(
                examples=examples,
                tokenizer=self.tokenizer,
                max_seq_length=QA_CONFIG['max_seq_length'],
                doc_stride=QA_CONFIG['doc_stride'],
                max_query_length=QA_CONFIG['max_query_length'],
                is_training=False,
                return_dataset="pt"
            )

            eval_sampler = SequentialSampler(dataset)
            eval_dataloader = DataLoader(dataset, sampler=eval_sampler, batch_size=QA_CONFIG['eval_batch_size'])

            all_results = []
            predictions = {}

            for batch in eval_dataloader:
                inputs = {
                    "input_ids": batch[0],
                    "attention_mask": batch[1],
                }
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
                    QA_CONFIG['n_best_per_passage_size'],
                    QA_CONFIG['max_answer_length'],
                    QA_CONFIG['do_lower_case'],
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
            logger.info("predictions_by_example at the end of inference %s",predictions_by_example)
            return predictions_by_example

    def postprocess(self, predictions_by_example,example,answer):
        # Post-processing of the model predictions to handle signature 
        contx = example[0]["passage"]
        data = example[0]["question"]
        response = {}

        logger.info("response without sign '%s'", response)
        response['text'] = predictions_by_example['text']
        response['prob'] = max(1.0, min(0.0, predictions_by_example['model_conf']))  # this is what the frontend expects

        # Evaluate the model prediction against the human answer
        human_ans = str(answer).strip()
        response['eval_f1'] = compute_f1(human_ans, response['text'])
        response['eval_exact'] = compute_exact(human_ans, response['text'])
        response['model_is_correct'] = response['eval_f1'] > THRESHOLD_F1
        
        stringlist = [str(response['model_is_correct']) + '|' + str(response['text']),
             contx , data]
        # pred_str = '|'.join(str(x) for x in response["prediction"])
        # stringlist = [pred_str,data,contx]
    
        response["signed"] = generate_response_signature(my_task_id,my_round_id,my_secret,stringlist)
        logger.info("response before return '%s'", response)
        #js = json.dumps(response)
        #return eval('[' + js + ']')
        return [response]

_service = TransformersSeqClassifierHandler()

def handle(data, context):
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        example, answer = _service.preprocess(data)
        predictions_by_example = _service.inference(example)
        response = _service.postprocess(predictions_by_example,example,answer)
        return response
    except Exception as e:
        raise e
def to_list(tensor):
    return tensor.detach().cpu().tolist()

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}".format(my_task_id, my_round_id).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logging.info('Signature {}'.format(signed))
    return signed
