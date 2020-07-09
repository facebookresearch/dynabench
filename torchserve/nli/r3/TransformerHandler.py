from abc import ABC
import json
import logging
import os
import ast
import torch
from allennlp.data.iterators import BasicIterator
from allennlp.nn.util import move_to_device
import hashlib
import json
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
from settings import my_secret,my_task_id,my_round_id
logger = logging.getLogger(__name__)
import time
# ================== Round 3 imports =================
import uuid
import sys
sys.path.append("/home/model-server/anli/src")

from data_utils.exvocab import ExVocabulary
import tqdm

from roberta_model.nli_training import RoBertaSeqClassification
from data_utils.readers.roberta_nli_reader import RoBertaNLIReader
from fairseq.models.roberta import RobertaModel
class NliTransformerHandler(BaseHandler, ABC):
    """
    Transformers handler class for NLI.
    """

    def __init__(self):
        super(NliTransformerHandler, self).__init__()
        self.initialized = False
    def initialize(self, ctx):

        #stub this for running this like a python program from main
        self.manifest = ctx.manifest
        properties = ctx.system_properties
        model_dir = properties.get("model_dir")
        print("Model Directory ",model_dir)
        print("Self.manifest  ",self.manifest)
        serialized_file = self.manifest['model']['serializedFile']

        # stub this for executing using serve --start commnd        
        # model_dir = os.getcwd()
        # serialized_file = "pytorch_model.pt"

        model_pt_path = os.path.join(model_dir, serialized_file)
        self.device = torch.device("cuda:" + str(properties.get("gpu_id")) if torch.cuda.is_available() else "cpu")
        #read configs for the mode, model_name, etc. from setup_config.json
        setup_config_path = os.path.join(model_dir, "setup_config.json")
        
        if os.path.isfile(setup_config_path):
            with open(setup_config_path) as setup_config_file:
                self.setup_config = json.load(setup_config_file)
        else:
            logger.warning('Missing the setup_config.json file.')
        

        ## NLI Custom codes
        self.input_list = True
        device_num = -1
        self.model_name = 'roberta_1'
        
        self.roberta_model_name = self.setup_config["model_name"]
        self.device_num = device_num
         # Setup Model
        do_lower_case = True
        bert_pretrain_path = model_dir

        max_input_l = self.setup_config["max_length"]
        num_labels = self.setup_config["num_labels"]
        
        print('--------------- Stage 1 ------------------- ')
        self.cur_roberta = torch.hub.load('pytorch/fairseq', self.roberta_model_name)
        #self.cur_roberta = RobertaModel.from_pretrained(model_dir, checkpoint_file='model.pt')
        self.model = RoBertaSeqClassification(self.cur_roberta, num_labels=num_labels)
        logger.info("The Roberta classification created")

        print('--------------- Stage 2 ------------------- ')
        if torch.cuda.is_available() and device_num != -1:
            self.model.load_state_dict(torch.load(model_pt_path))
        else:
            self.model.load_state_dict(torch.load(model_pt_path, map_location='cpu'))
        
        logger.info("The state_dict loaded")
        self.model.to(self.device)

        print('--------------- Stage 3 ------------------- ')
        self.cs_reader = RoBertaNLIReader(self.cur_roberta,
                                          lazy=False, example_filter=None, max_seq_l=max_input_l)
        logger.info("The RoBertaNLIReader created")

        print('--------------- Stage 4 ------------------- ')
        unk_token_num = {'tokens': 1}  # work around for initiating vocabulary.
        vocab = ExVocabulary(unk_token_num=unk_token_num)
        vocab.add_token_to_namespace('e', namespace='labels')
        vocab.add_token_to_namespace('n', namespace='labels')
        vocab.add_token_to_namespace('c', namespace='labels')
        vocab.add_token_to_namespace("h", namespace="labels")
        vocab.change_token_with_index_to_namespace("h", -2, namespace='labels')
        self.biterator = BasicIterator(batch_size=32)
        self.biterator.index_with(vocab)
        print('--------------- Stage 5 ------------------- ')
        self.initialized = True

    def preprocess(self, data):
        """ Basic text preprocessing, based on the user's chocie of application mode.
        """
        print('--------------- Preprocess satge 1 ------------------- ')
        logger.info("In preprocess, Recieved data '%s'",data)
        body = data[0].get("body")
        bert_input = {
            's1': body["context"],
            's2': body["hypothesis"]
        }
        example = bert_input
        if 's1' in example and 's2' in example:
            if 'y' not in example:
                example['y'] = 'h'
            if 'uid' not in example:
                example['uid'] = str(uuid.uuid4())
        else :
            example['status'] = 'invalid'
        logger.info("In preprocess , example: '%s'",example)

        # e_result = preprocessing(example)
        # example.update(e_result)
        # example['status'] = 'finished'
        # example['model_name'] = self.model_name
        print('--------------- Preprocess satge example ------------------- ', example)
        
        return example

    def inference(self, examples, show_progress=False):
        """ Predict the class (or classes) of the received text using the serialized transformers checkpoint.
        """
        start_time = time.time()
        print('----------------- Inference -------------------')
        self.input_list = True  # if input is list, we return list, else we return instance.
        if not isinstance(examples, list):
            self.input_list = False
            examples = [examples]
        
        print('examples ============== ', examples)
        print('----------------- Inference -------------------', examples)
        
        instances = self.cs_reader.read(examples)
        logger.info("In inference, instances '%s'", instances)
        print('----------------- Inference  instances -------------------', instances)
        
        data_iter = self.biterator(instances, num_epochs=1, shuffle=True)
        logger.info("In inference, e_iter data '%s'", data_iter)
        print('----------------- Inference  e_iter -------------------', data_iter)

        with_probs = True
        make_int = False
        model = self.model
       
        id2label = {
            0: "e",
            1: "n",
            2: "c"
        }

        # print("Evaluating ...")
        tqdm_disable = not show_progress
        with torch.no_grad():
            model.eval()
            totoal_size = 0

            y_pred_list = []
            y_fid_list = []
            y_pid_list = []
            y_element_list = []

            y_logits_list = []
            y_probs_list = []

            for batch_idx, batch in enumerate(data_iter):
                batch = move_to_device(batch, self.device_num)

                eval_paired_sequence = batch['paired_sequence']
                eval_paired_segments_ids = batch['paired_segments_ids']
                eval_labels_ids = batch['label']
                eval_att_mask = batch['paired_mask']
                # eval_s1_span = batch['bert_s1_span']
                # eval_s2_span = batch['bert_s2_span']

                output = model(input_ids=eval_paired_sequence, attention_mask=eval_att_mask,
                            token_type_ids=eval_paired_segments_ids,
                            mode=RoBertaSeqClassification.ForwardMode.EVAL)
                # We give label is None then the first output is logits
                out = output

                y_pid_list.extend(list(batch['uid']))
                y_fid_list.extend(list(batch['fid']))
                y_element_list.extend(list(batch['item']))

                y_pred_list.extend(torch.max(out, 1)[1].view(out.size(0)).tolist())
                y_logits_list.extend(out.tolist())

                if with_probs:
                    y_probs_list.extend(F.softmax(out, dim=1).tolist())

                totoal_size += out.size(0)

        result_items_list = []
        assert len(y_pred_list) == len(y_fid_list)
        assert len(y_pred_list) == len(y_pid_list)
        assert len(y_pred_list) == len(y_element_list)

        assert len(y_pred_list) == len(y_logits_list)

        if with_probs:
            assert len(y_pred_list) == len(y_probs_list)

        for i in range(len(y_pred_list)):
            r_item = dict()
            r_item['fid'] = y_fid_list[i]
            r_item['uid'] = y_pid_list[i] if not make_int else int(y_pid_list[i])
            r_item['logits'] = y_logits_list[i]
            r_item['element'] = y_element_list[i]
            r_item['predicted_label'] = id2label[y_pred_list[i]]

            if with_probs:
                r_item['prob'] = y_probs_list[i]

            result_items_list.append(r_item)
        print("inference time --------------- %s seconds  ----------------" % (time.time() - start_time))
        print('----------------- Inference returns -------------------', result_items_list)
        return result_items_list

    def postprocess(self, inference_output,data):
        inference_output = inference_output[0]

        pred_str = '|'.join(str(x) for x in inference_output["prob"])
        stringlist = [pred_str,data["s1"],data["s2"]]
        

        inference_output["s1"] = data["s1"]
        inference_output["s2"] = data["s2"]
        inference_output["y"]   = data["y"]
        inference_output["status"] = "finished"
        inference_output['model_name'] = self.model_name
        
        inference_output["signed"] =generate_response_signature(my_task_id,my_round_id,my_secret,stringlist)
        print(inference_output)
        logger.info("response before json '%s'", inference_output)

        if self.input_list :
            inference_output = [inference_output]

        return [inference_output]

_service = NliTransformerHandler()


def handle(data, context):
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None
        input_text = _service.preprocess(data)
        output = _service.inference(input_text)
        response = _service.postprocess(output,input_text)
        print(response)

        return response
    except Exception as e:
        raise e

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}".format(my_task_id, my_round_id).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logging.info('Signature {}'.format(signed))
    return signed

#use this to execute the file like a python program
# if __name__ == '__main__':
#     print('----------------------------')
#     logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
#     try:
#         data = [{"body":{"context":"Baltic Pride is an annual LGBT pride parade rotating in turn between the capitals of the Baltic states; Tallinn, Riga and Vilnius. It is held in support of raising issues of tolerance and the rights of LGBT community and is supported by ILGA-Europe. Since 2009 the main organisers have been Mozaīka, the National LGBT Rights Organization LGL Lithuanian Gay League, and the Estonian LGBT Association.",
#         "hypothesis":"HAHAHAHA"}}]
#         rslt = handle(data, None)
#     except Exception as ex:
#         logging.exception(ex)
