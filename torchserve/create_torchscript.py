import transformers
from pathlib import Path
import os
import json
import torch
from transformers import (AutoModelForSequenceClassification, AutoTokenizer, AutoModelForQuestionAnswering,
 AutoModelForTokenClassification, AutoConfig,RobertaForSequenceClassification, RobertaTokenizer)
from transformers import set_seed
import logging
logger = logging.getLogger(__name__)
""" This function, save the checkpoint, config file along with tokenizer config and vocab files
    of a transformer model of your choice.
"""
print('Transformers version',transformers.__version__)
set_seed(1)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def transformers_model_dowloader(mode,pretrained_model_name,num_labels,do_lower_case,max_length,torchscript, round_path,save_mode,model_dir):
    print(f"Use model from {model_dir} and tokenizer from {round_path}")
    #loading pre-trained model and tokenizer
    if mode== "sequence_classification":
        print("creating sequence classification torchscript")
        config = AutoConfig.from_pretrained(round_path,num_labels=num_labels,torchscript=torchscript)
        model = AutoModelForSequenceClassification.from_pretrained(model_dir, config=config)
        tokenizer = RobertaTokenizer.from_pretrained(round_path)
    elif mode== "question_answering":
        print("creating question answering torchscript")
        config = AutoConfig.from_pretrained(round_path,torchscript=torchscript)
        model = AutoModelForQuestionAnswering.from_pretrained(model_dir,config=config)
        tokenizer = AutoTokenizer.from_pretrained(round_path,do_lower_case=do_lower_case)

        # NOTE : for demonstration purposes, we do not go through the fine-tune processing here.
        # A Fine_tunining process based on your needs can be added.
        # An example of  Fine_tuned model has been provided in the README.

    NEW_DIR = model_dir
    try:
        os.mkdir(NEW_DIR)
    except OSError:
        print ("Creation of directory %s failed" % NEW_DIR)
    else:
        print ("Successfully created directory %s " % NEW_DIR)

    print("Save model and tokenizer/ Torchscript model based on the setting from setup_config", pretrained_model_name, 'in directory', NEW_DIR)
    if save_mode == "pretrained":
        model.save_pretrained(NEW_DIR)
        tokenizer.save_pretrained(NEW_DIR)
    elif save_mode == "torchscript":
        dummy_input = "This is a dummy input for torch jit trace"

        inputs = tokenizer.encode_plus([dummy_input],max_length = int(max_length), add_special_tokens = True, return_tensors = 'pt', return_attention_mask= True)
        logger.info("Inputs after encode_plus: '%s'", inputs)
        input_ids= inputs["input_ids"].to(device)
        attention_mask = inputs['attention_mask'].to(device)
    
        model.to(device).eval()
        with torch.jit.optimized_execution(True):
            traced_model = torch.jit.trace(model, (input_ids,attention_mask))
            torch.jit.save(traced_model,os.path.join(NEW_DIR, "pytorch_model.pt"))
    return
def create_ts(round_folder,model_dir):
    dirname = round_folder
    filename = os.path.join(dirname, 'setup_config.json')
    f = open(filename)
    settings = json.load(f)
    mode = settings["mode"]
    model_name = settings["model_name"]
    num_labels = int(settings["num_labels"])
    do_lower_case = settings["do_lower_case"]
    max_length = settings["max_length"]
    save_mode = settings["save_mode"]
    if save_mode == "torchscript":
        torchscript = True
    else:
        torchscript = False

    transformers_model_dowloader(mode,model_name, num_labels,do_lower_case, max_length, torchscript, dirname,save_mode,model_dir)