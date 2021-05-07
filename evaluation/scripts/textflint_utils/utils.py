# Copyright (c) Facebook, Inc. and its affiliates.

# Convert data to textflint format and run transform functions in textflint
import json
import os
import re

from textflint import Engine


CONFIG_PATH = "textflint_utils/configs"
TRANSFORM_FIELDS = {
    "nli": {"context": "premise", "hypothesis": "hypothesis"},
    "sentiment": {"statement": "x"},
    "hs": {"statement": "x"},
    "qa": {"context": "context", "question": "question"},
}

LABEL_FIELD = {"nli": "label", "sentiment": "label", "hs": "label", "qa": "answer"}

LABEL_MAP = {
    "nli": {
        "neutral": "neutral",
        "contradictory": "contradiction",
        "entailed": "entailment",
    },
    "sentiment": {"positive": "positive", "negative": "negative", "neutral": "neutral"},
    "hs": {"hateful": "hateful", "not-hateful": "not-hateful"},
}


# This converts dynabench dataset to textflint format
def reformat_data_to_textflint(samples, task):
    converted_samples = []
    perturb_fields = TRANSFORM_FIELDS.get(task, None)
    label_map = LABEL_MAP.get(task, None)
    for i in range(len(samples)):
        sample = samples[i]
        converted = {"sample_id": i + 1}
        if task == "qa":
            answer = sample["answer"]
            converted["answers"] = [
                {"text": answer, "answer_start": i.start()}
                for i in re.finditer(answer, sample["context"])
            ]
            converted["title"] = ""
            converted["is_impossible"] = False
        else:
            converted["y"] = label_map[sample["label"]]
        for key, value in perturb_fields.items():
            converted[value] = sample[key]
        converted_samples.append(converted)

    return converted_samples


def load_config(config_path):
    config = None
    with open(config_path) as f:
        config = json.loads(f.read())

    return config


def get_orig_value(data, sample, field):
    return data[sample["sample_id"]][field]


def get_transformed_data(config_path, data, task):
    config = load_config(config_path)
    out_dir = config["out_dir"]
    out_files = os.listdir(out_dir)
    trans_samples = []
    perturb_fields = TRANSFORM_FIELDS.get(task, None)
    label_field = LABEL_FIELD.get(task, None)
    for fname in out_files:
        if fname.startswith("ori"):
            continue
        fname = os.path.join(out_dir, fname)
        parts = fname.split("_")
        new_suffix = "_".join(parts[1:-1])
        with open(fname) as f:
            for line in f:
                sample = json.loads(line)
                trans_sample = {"input_id": get_orig_value(data, sample, "uid")}
                trans_sample[label_field] = get_orig_value(data, sample, label_field)
                for key, value in perturb_fields.items():
                    trans_sample[key] = sample[value]
                # create an unique uid for new examples
                trans_sample["uid"] = str(trans_sample["input_id"]) + "_" + new_suffix
                trans_samples.append(trans_sample)

    return trans_samples


def run_textflint(data, task):
    textflint_data = reformat_data_to_textflint(data, task)
    engine = Engine()
    config_file = os.path.join(CONFIG_PATH, task + "_config.json")
    engine.run(textflint_data, config_file)
    perturbed_data = get_transformed_data(config_file, data, task)
    return perturbed_data
