import hashlib
import logging
logger = logging.getLogger(__name__)
import os
import json

import torch

def generate_response_signature(my_task_id, my_round_id, my_secret, stringlist):
    """ 
    This function generates a unique signature based on task, round, input and probability 
    """
    h = hashlib.sha1()
    for x in stringlist:
        h.update(x.encode('utf-8'))
    h.update("{}{}".format(my_task_id, my_round_id).encode('utf-8'))
    h.update(my_secret.encode('utf-8'))
    signed = h.hexdigest()
    logger.info('Signature {}'.format(signed))
    return signed

def check_fields(data, fields):
    """ 
    Checks if the attributes present in the fields list are present in data
    """
    if not data:
        return False
    for f in fields:
        if f not in data:
            print(f"The {f} is not present")
            return False
    return True

def handler_initialize(ctx):
    """
    This functions initializes the variables neccessary for the handler
    """
    manifest = ctx.manifest
    properties = ctx.system_properties
    model_dir = properties["model_dir"]
    serialized_file = manifest["model"]["serializedFile"]
    model_pt_path = os.path.join(model_dir, serialized_file)
    device = torch.device(
        "cuda:" + str(properties["gpu_id"])
        if torch.cuda.is_available() else "cpu")
    # read configs for the mode, model_name, etc. from setup_config.json
    setup_config_path = os.path.join(model_dir, "setup_config.json")

    if os.path.isfile(setup_config_path):
        with open(setup_config_path) as setup_config_file:
            setup_config = json.load(setup_config_file)
    else:
        raise FileNotFoundError("Missing the setup_config.json file.")

    attribute_list = ["my_task_id", "my_round_id", "model_name", "mode", "do_lower_case", \
                      "num_labels", "max_length", "save_mode"]
    if not check_fields(setup_config, attribute_list):
        raise AttributeError("Attributes missing in setup_config file")

    return model_dir, model_pt_path, device, setup_config

def remove_sp_chars(text):
    """
    This removes special characters from the text
    """
    return text.encode('ascii', 'ignore').decode('ascii')

# Captum helper functions
def construct_input_ref(text, tokenizer, device):
    """
    For a given text, this function creates token id, reference id and
    attention mask based on encode which is faster for captum insights
    """
    text_ids = tokenizer.encode(text, add_special_tokens=False)
    # construct input token ids
    input_ids = [tokenizer.cls_token_id] + text_ids + [tokenizer.sep_token_id]
    input_ids = torch.tensor([input_ids], device=device)
    # construct reference token ids
    ref_input_ids = [tokenizer.cls_token_id] + [tokenizer.pad_token_id] * len(text_ids) + [tokenizer.sep_token_id]
    ref_input_ids = torch.tensor([ref_input_ids], device=device)
    # construct attention mask
    attention_mask = torch.ones_like(input_ids)
    return input_ids, ref_input_ids, attention_mask

def construct_input_ref_pair(text_seq_1, text_seq_2, tokenizer, device):
    """
    For a given pair of text, this function creates token id, reference id
    and attention mask based on encode which is faster for captum insights
    """
    seq1_ids = tokenizer.encode(text_seq_1, add_special_tokens=False)
    seq2_ids = tokenizer.encode(text_seq_2, add_special_tokens=False)
    # construct input token ids
    input_ids = [tokenizer.cls_token_id] + seq1_ids + [tokenizer.sep_token_id] + \
                seq2_ids + [tokenizer.sep_token_id]
    input_ids = torch.tensor([input_ids], device=device)
    # construct reference token ids
    ref_input_ids = [tokenizer.cls_token_id] + [tokenizer.pad_token_id] * len(seq1_ids) + [tokenizer.sep_token_id] + \
                    [tokenizer.pad_token_id] * len(seq2_ids) + [tokenizer.sep_token_id]
    ref_input_ids = torch.tensor([ref_input_ids], device=device)
    # construct attention mask
    attention_mask = torch.ones_like(input_ids)
    return input_ids, ref_input_ids, attention_mask

def get_word_token(input_ids, tokenizer):
    """
    constructs word tokens from token id
    """
    indices = input_ids[0].detach().tolist()
    tokens = tokenizer.convert_ids_to_tokens(indices)
    # Remove unicode space character from BPE Tokeniser
    tokens = [token.replace("Ġ", "") for token in tokens]
    return tokens

def get_nli_word_token(input_ids, model):
    """
    constructs word tokens from token ids to show captum word importance.
    Iteratore and decode each token id to get individual token words
    instead of complete sentence from roberta decoder
    """
    all_tokens=[]
    sentence_start=True
    #Token id to find start and end of sentence
    separator_token=[0,2]
    for token in input_ids.squeeze(0).tolist():
        if token in separator_token:
            #Change start and end token word for better visibility. Default is invisible
            if sentence_start:
                all_tokens.append("<s>")
                sentence_start = False
            else:
                all_tokens.append("</s>")
                sentence_start = True
        else:
            all_tokens.append(model.decode(torch.Tensor([token]).long()))
    return all_tokens

def captum_nli_forward_func(paired_sequence, paired_segments_ids, attention_mask, model=None, mode=None):
    """
    A custom forward function to access different positions of the predictions
    """
    pred = model(input_ids=paired_sequence, attention_mask=attention_mask,
                 token_type_ids=paired_segments_ids,
                 mode=mode)
    return pred

def captum_sequence_forward(inputs, attention_mask=None, position=0, model=None):
    """
    A custom forward function to access different positions of the predictions
    """
    model.eval()
    model.zero_grad()
    pred = model(inputs, attention_mask=attention_mask)
    pred = pred[position]
    return pred

def captum_qa_forward(inputs, attention_mask=None, position=0, model=None):
    """
    A custom forward function to access different positions of the predictions
    for Question Answering
    """
    pred = model(inputs, attention_mask=attention_mask)
    pred = pred[position]
    return pred.max(1).values

def summarize_attributions(attributions):
    """
    Summarises the attribution across multiple runs
    """
    attributions = attributions.sum(dim=-1).squeeze(0)
    attributions = attributions / torch.norm(attributions)
    return attributions
