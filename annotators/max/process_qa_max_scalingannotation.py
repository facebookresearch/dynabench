#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.

import json
import time
from pprint import pprint

import numpy as np
import pandas as pd
from mephisto.abstractions.databases.local_database import LocalMephistoDB
from mephisto.data_model.worker import Worker
from mephisto.tools.data_browser import DataBrowser as MephistoDataBrowser


BONUS = 0.50
RUN_VALIDATION = False
CALCULATE_TIMES = False

if CALCULATE_TIMES:
    # Note: we are checking the mephisto db to get the HIT durations
    db = LocalMephistoDB()
    mephisto_data_browser = MephistoDataBrowser(db=db)
    units = mephisto_data_browser.get_units_for_task_name("max-qa-1")

    # Resolve dynabench and mturk IDs
    mephisto_durations_by_worker_id = {}
    for unit in units:
        unit_data = mephisto_data_browser.get_data_from_unit(unit)
        worker_name = Worker(db, unit_data["worker_id"]).worker_name

        contents = unit_data["data"]
        # if contents["outputs"]["final_data"]["taskCompleted"] == True:
        duration = contents["times"]["task_end"] - contents["times"]["task_start"]
        mephisto_durations_by_worker_id.setdefault(worker_name, []).append(duration)

# Load and process validation
val_file_path = "annotated_data/val.csv"

# Load and process results
df = pd.read_json("annotated_data/export.json")

# Filter out non-mturk examples
df["metadata_json"] = df["metadata_json"].apply(
    lambda x: json.loads(x)
)  # convert metadata to json
df["is_mturk"] = df["metadata_json"].apply(lambda x: "annotator_id" in x)
df = df.loc[df["is_mturk"] == True]
print(f"Total mTurk examples: {len(df)}")

# Extract key data
df["context_text"] = df["context"].apply(lambda x: x["context"])
df["annotator_id"] = df["metadata_json"].apply(lambda x: x["annotator_id"])
df["mephisto_id"] = df["metadata_json"].apply(lambda x: x["mephisto_id"])
df["agent_id"] = df["metadata_json"].apply(lambda x: x["agentId"])
df["assignment_id"] = df["metadata_json"].apply(lambda x: x["assignmentId"])
df["experiment_mode_id"] = df["metadata_json"].apply(lambda x: x["experiment_mode"]["id"])
df["model_name"] = df["metadata_json"].apply(lambda x: x["model_name"])
df["generator_name"] = df["metadata_json"].apply(lambda x: x["generator_name"])
df["time_taken"] = df["metadata_json"].apply(lambda x: x["timer_active_time_ms"] / 1000)
df["val_approved"] = "empty"
df["val_qtype"] = "empty"
# print(f"df has keys: {df.keys()}")

NUM_EXPERIMENT_MODES = 15
experiment_mode_ids = list(range(NUM_EXPERIMENT_MODES))

for i, row in df.iterrows():
    print(i)
    print("AssignmentID", row["assignment_id"])
    print("MephistoID", row["mephisto_id"])
    pprint(row["metadata_json"]["timer_active_time_ms"])
    print('---')
    if i > 20:
        raise BaseException






# We validate all the model fooling examples that have not yet been validated
# Load and combine
try:
    df_val = pd.read_csv(val_file_path)
    # Get new assignments from results
    df_val = pd.concat(
        [df_val, df[~(df["assignment_id"].isin(df_val["assignment_id"].tolist()))]]
    )
except FileNotFoundError:
    df_val = df.copy()

# print(df_val.loc[df_val['val_approved'] != 'empty'].head())
# raise BaseException

# Run the validation
question_types = {
    "E": "Explicit",
    "P": "Paraphrasing",
    "Ext": "External Knowledge",
    "Coref": "Co-reference",
    "MH": "Multi-Hop",
    "Comp": "Comparative",
    "Num": "Numeric",
    "Neg": "Negation",
    "F": "Filtering",
    "T": "Temporal",
    "S": "Spatial",
    "Ind": "Inductive",
    "Imp": "Implicit",
}
question_types_low = {k.lower(): v for k, v in question_types.items()}


if RUN_VALIDATION:
    df_to_val = df_val.loc[
        (df_val["model_wrong"] == True) & (df_val["val_approved"] == "empty")
    ]
    for i, row in df_to_val.iterrows():
        print(
            "{} examples requiring validation".format(
                len(
                    df_val.loc[
                        (df_val["model_wrong"] == True)
                        & (df_val["val_approved"] == "empty")
                    ]
                )
            )
        )
        print("---")
        print(
            row["context_text"].replace(row["target_pred"], row["target_pred"].upper())
        )
        print("---")
        print(f"Q: {row['text']}")
        print(f"Human ans: {row['target_pred']}")
        print(f"Model ans: {row['model_preds'].split('|')[-1]}")
        print("---")

        print("Is the example valid? (y/n):")
        validation_response = None
        while not validation_response or validation_response not in ["y", "n"]:
            if validation_response:
                print("Please reply with y (yes) or n (no):")
            validation_response = str(input())

        if validation_response == "y":
            df_val.at[i, "val_approved"] = "yes"
            print("Example APPROVED")
            print("---")

            qtype_response = None
            correct_response = None
            while not qtype_response or correct_response != "y":
                qtypes_print = ", ".join(
                    [f"{k}: {v}" for k, v in question_types.items()]
                )
                print(f"What type of question is it? ({qtypes_print}):")
                qtype_response = str(input())
                qtypes = [x.strip().lower() for x in qtype_response.split(",")]
                qtypes_print = ", ".join(
                    [question_types_low[x] for x in qtypes if x in question_types_low]
                )
                print(f"The question type is: {qtypes_print}")

                print("Is this correct? (y/n):")
                correct_response = None
                while not correct_response or correct_response not in ["y", "n"]:
                    if correct_response:
                        print("Please reply with y (yes) or n (no):")
                    correct_response = str(input())

            df_val.at[i, "val_qtype"] = qtype_response

        else:
            df_val.at[i, "val_approved"] = "no"
            print("Example REJECTED")

        # Save the validation df
        df_val.to_csv(val_file_path, index=False)
        time.sleep(0.5)
        print()
        print("---")
        print()


# Update df with the df_val results
vals_by_assignment = {
    row["assignment_id"]: {
        "val_approved": row["val_approved"],
        "val_qtype": row["val_qtype"],
    }
    for i, row in df_val.loc[df_val["val_approved"] != "empty"].iterrows()
}
for i, row in df.iterrows():
    if row["assignment_id"] in vals_by_assignment:
        df.at[i, "val_approved"] = vals_by_assignment[row["assignment_id"]][
            "val_approved"
        ]
        df.at[i, "val_qtype"] = vals_by_assignment[row["assignment_id"]]["val_qtype"]

# Save some validated model fooling examples
SAVE_FOOLING_EXAMPLES = False
if SAVE_FOOLING_EXAMPLES:
    df_model_fooling = df.loc[
        (df["model_wrong"] == True) & (df["val_approved"] == "yes")
    ]
    df_model_fooling.to_csv("annotated_data/model_fooling_examples.csv", index=False)


# # Print specific context
# context_text = """Until 1932 the generally accepted length of the Rhine was
# 1,230 kilometres (764 miles). In 1932 the German encyclopedia Knaurs Lexiko"""
# for i, row in df.iterrows():
#     if context_text in row['context_text']:
#         print(row['context_text'])
#         print('---')
#         print(f"Q: {row['text']}")
#         print(f"Human ans: {row['target_pred']}")
#         print(f"Model ans: {row['model_preds'].split('|')[-1]}")
#         raise BaseException

# Loop through model_names and get stats
# model_names = df['model_name'].unique()
model_names = ["roberta_r1", "roberta_r2", "roberta_r2_synthq", "roberta_r2_synthq_ext"]

annotators_to_remove = [
    k for k, v in df["annotator_id"].value_counts().items() if v < 5
]
for model_name in model_names:
    df_temp = df.loc[
        (df["model_name"] == model_name)
        & (~df["annotator_id"].isin(annotators_to_remove))
    ]
    num_examples = len(df_temp)
    num_fooling_examples = len(df_temp.loc[df_temp["model_wrong"] == True])
    num_non_fooling_examples = len(df_temp.loc[df_temp["model_wrong"] == False])
    num_verified_fooling_examples = len(
        df_temp.loc[
            (df_temp["model_wrong"] == True)
            & (
                (df_temp["val_approved"] == "yes")
                | (df_temp["val_approved"] == "empty")
            )
        ]
    )
    num_verified_examples = num_verified_fooling_examples + num_non_fooling_examples
    num_annotators = len(df_temp["annotator_id"].unique())
    mer = 100 * num_fooling_examples / num_examples
    vmer = 100 * num_verified_fooling_examples / num_verified_examples

    # Get durations
    worker_ids = [
        x for x in df_temp["annotator_id"].unique() if x not in annotators_to_remove
    ]
    if CALCULATE_TIMES:
        worker_durations = [
            mephisto_durations_by_worker_id[w_id]
            for w_id in worker_ids
            if w_id in mephisto_durations_by_worker_id
            and w_id not in annotators_to_remove
        ]
        flat_worker_durations = [x for sublist in worker_durations for x in sublist]
        time_per_question = sum(flat_worker_durations) / num_examples

    num_annotators = len(worker_ids)
    num_examples_by_annotator = [
        len(df_temp.loc[df_temp["annotator_id"] == w_id]) for w_id in worker_ids
    ]
    num_verified_examples_by_annotator = [
        len(
            df_temp.loc[
                (df_temp["annotator_id"] == w_id)
                & (
                    (df_temp["val_approved"] == "yes")
                    | (df_temp["val_approved"] == "empty")
                )
            ]
        )
        for w_id in worker_ids
    ]

    num_fooling_examples_by_annotator = [
        len(
            df_temp.loc[
                (df_temp["annotator_id"] == w_id) & (df_temp["model_wrong"] == True)
            ]
        )
        for w_id in worker_ids
    ]
    num_verified_fooling_examples_by_annotator = [
        len(
            df_temp.loc[
                (df_temp["annotator_id"] == w_id)
                & (df_temp["model_wrong"] == True)
                & (
                    (df_temp["val_approved"] == "yes")
                    | (df_temp["val_approved"] == "empty")
                )
            ]
        )
        for w_id in worker_ids
    ]

    mer_by_annotator = [
        100 * x / y
        for x, y in zip(num_fooling_examples_by_annotator, num_examples_by_annotator)
    ]
    vmer_by_annotator = [
        100 * x / y
        for x, y in zip(
            num_verified_fooling_examples_by_annotator,
            num_verified_examples_by_annotator,
        )
        if y > 0
    ]

    macro_mer = np.mean(mer_by_annotator)
    macro_vmer = np.mean(vmer_by_annotator)

    print(f"Model: {model_name}")
    print(f"Num Unique Annotators: {num_annotators}")
    print(f"Num Verified Unique Annotators: {len(vmer_by_annotator)}")
    print(f"Num Examples: {num_examples}")
    print(f"Num Verified Examples: {num_verified_examples}")
    print(f"Num Fooling Examples: {num_fooling_examples}")
    print(f"Num Verified Fooling Examples: {num_verified_fooling_examples}")
    print(f"Num Examples / Annotator: {num_examples / num_annotators:.1f}")
    print("--")
    print(f"MER: {mer:.4f}%")
    print(f"vMER: {vmer:.4f}%")
    print(f"Macro MER: {macro_mer:.4f}%")
    print(f"Macro vMER: {macro_vmer:.4f}%")
    if CALCULATE_TIMES:
        print(f"Time per question: {time_per_question:.2f}s")
    print("=====")
