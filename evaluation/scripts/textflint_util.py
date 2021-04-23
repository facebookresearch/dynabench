# Copyright (c) Facebook, Inc. and its affiliates.

# Convert data to textflint format and run transform functions in textflint
import json
import os
import torch
from textflint import Engine

CONFIG_PATH = "../configs"
TRANSFORM_FIELDS = {
    'nli': {
        'context': 'premise',
        'hypothesis': 'hypothesis',
    },
    'sentiment': {
        'context': 'x',
    },
    'hs': {
        'context': 'x',
    },
    'qa': {
        'context': 'context',
        'question': 'question',
    },
}

LABEL_MAP = {
    'nli': {
        'n': 'neutral',
        'c': 'contradiction',
        'e': 'entailment',
    },
    'sentiment': {
        'positive': 'positive',
        'negative': 'negative',
        'neutral': 'neutral',
    },
    'hs': {
        'hate': 'hate',
        'nothate': 'nothate',
    },
}


# This converts dynabench dataset to textflint format
def convert_data_to_textflint(samples, task):
    converted_samples = []
    perturb_fields = TRANSFORM_FIELDS.get(task, None)
    label_map = LABEL_MAP.get(task, None)
    for i in range(len(samples)):
        sample = samples[i]
        converted = {
            'y': label_map[sample['label']],
            'sample_id': i + 1,
        }
        for key, value in perturb_fields.items():
            converted[value] = sample[key]
        converted_samples.append(converted)

    return converted_samples


def load_config(config_path):
    config = None
    with open(config_path, 'rt') as f:
        config = json.loads(f.read())

    return config


def get_orig_value(data, sample, field):
    return data[sample['sample_id']][field]


def get_transformed_data(config_path, data, task):
    config = load_config(config_path)
    out_dir = config["out_dir"]
    out_files = os.listdir(out_dir)
    trans_samples = []
    perturb_fields = TRANSFORM_FIELDS.get(task, None)
    label_map = LABEL_MAP.get(task, None)
    label_map = {v : k for k, v in label_map.items()}
    for fname in out_files:
        if fname.startswith("ori"):
            continue
        fname = os.path.join(out_dir, fname)
        parts = fname.split('_')
        new_suffix = '_'.join(parts[1:-1])
        with open(fname, 'rt') as f:
            for line in f:
                sample = json.loads(line)
                trans_sample = {
                    "label": get_orig_value(data, sample, "label"),
                    "input_id": get_orig_value(data, sample, "uid"),
                }
                for key, value in perturb_fields.items():
                    trans_sample[key] = sample[value]
                # create an unique uid for new examples
                trans_sample['uid'] = trans_sample['input_id'] + "_" + new_suffix
                trans_samples.append(trans_sample)

    return trans_samples


def run_textflint(data, task):
    textflint_data = convert_data_to_textflint(data, task)
    engine = Engine()
    config_file = os.path.join(CONFIG_PATH, task + "_config.json")
    engine.run(textflint_data, config_file)
    perturbed_data = get_transformed_data(config_file, data, task)
    return perturbed_data
