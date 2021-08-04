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


RANDOM_SEED = 27
BONUS = 0.50

RUN_VALIDATION = True
ANNOTATE_QUESTION_TYPES = False
SAVE_FOOLING_EXAMPLES = False

# Load and process validation
val_file_path = "annotated_data/val.pkl"

# Load and process results
df = pd.read_json("annotated_data/export.json")

# Filter out non-mturk examples
df["metadata_json"] = df["metadata_json"].apply(
    lambda x: json.loads(x)
)  # convert metadata to json
df["is_mturk"] = df["metadata_json"].apply(lambda x: "annotator_id" in x)
df = df.loc[df["is_mturk"] == True]
print(f"Total mTurk examples: {len(df)}")

def get_num_generations(metadata_json, mode='all'):
    assert mode in ['all', 'cache', 'generated']
    example_history = json.loads(metadata_json["exampleHistory"])
    # pprint(example_history)
    if mode == 'all':
        return len([x for x in example_history if "activityType" in x and "Generated" in x["activityType"]])
    return len([x for x in example_history if "questionType" in x and mode in x["questionType"]])

# Extract key data
df["context_text"] = df["context"].apply(lambda x: x["context"])
df["annotator_id"] = df["metadata_json"].apply(lambda x: x["annotator_id"])
df["mephisto_id"] = df["metadata_json"].apply(lambda x: x["mephisto_id"])
df["agent_id"] = df["metadata_json"].apply(lambda x: x["agentId"])
df["assignment_id"] = df["metadata_json"].apply(lambda x: x["assignmentId"])
df["experiment_mode_id"] = df["metadata_json"].apply(lambda x: x["experiment_mode"]["id"])
df["experiment_mode"] = df["metadata_json"].apply(lambda x: x["experiment_mode"])
df["model_name"] = df["metadata_json"].apply(lambda x: x["model_name"])
df["generator_name"] = df["metadata_json"].apply(lambda x: x["generator_name"])
df["timer_active_s"] = df["metadata_json"].apply(lambda x: x["timer_active_time_ms"] / 1000)
df["validated_by_annotator"] = df["metadata_json"].apply(lambda x: x["validated_by_annotator"])
df["num_generations"] = df["metadata_json"].apply(lambda x: get_num_generations(x))
df["num_generations_cached"] = df["metadata_json"].apply(lambda x: get_num_generations(x, 'cache'))
df["num_generations_generated"] = df["metadata_json"].apply(lambda x: get_num_generations(x, 'generated'))
df["val_approved"] = "empty"
df["val_qtype"] = "empty"
# print(f"df has keys: {df.keys()}")


# Extract times per question
times_by_assignment = {}
for i, row in df.iterrows():
    if row["assignment_id"] not in times_by_assignment:
        times_by_assignment[row["assignment_id"]] = {}
    times_by_assignment[row["assignment_id"]][row["metadata_json"]["current_tries"]] = row["timer_active_s"]

def get_time_taken(row, times_by_assignment=times_by_assignment):
    assignment_id = row["assignment_id"]
    current_tries = row["metadata_json"]["current_tries"]
    current_timer = row["timer_active_s"]
    
    time_taken = -1
    if current_tries == 0:
        time_taken = current_timer
    if current_tries - 1 in times_by_assignment[assignment_id]:
        time_taken = current_timer - times_by_assignment[assignment_id][current_tries - 1]
    return time_taken if time_taken > 0 else np.nan

# Get time taken for each question
df["time_taken_q"] = df.apply(lambda x: get_time_taken(x), axis=1)
print(f"#Examples for which time taken could not be resolved: {len(df[df.time_taken_q.isnull()])}")
print(f"Total unique annotators: {len(df.annotator_id.unique())}")
print("="*5)

NUM_EXPERIMENT_MODES = 15
experiment_mode_ids = list(range(NUM_EXPERIMENT_MODES))

experiment_modes = [
    {
        "id": 0,
        "adversary": "none",
        "generator": "none",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 1,
        "adversary": "none",
        "generator": "qgen_squad1",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 2,
        "adversary": "none",
        "generator": "qgen_squad1",
        "filterMode": "adversarial",
        "answerSelect": "none",
    },
    {
        "id": 3,
        "adversary": "none",
        "generator": "qgen_squad1",
        "filterMode": "uncertain",
        "answerSelect": "none",
    },
    {
        "id": 4,
        "adversary": "electra-synqa",
        "generator": "none",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 5,
        "adversary": "electra-synqa",
        "generator": "qgen_squad1",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 6,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 7,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined_plus_squad_10k",
        "filterMode": "",
        "answerSelect": "none",
    },
    {
        "id": 8,
        "adversary": "electra-synqa",
        "generator": "qgen_squad1",
        "filterMode": "adversarial",
        "answerSelect": "none",
    },
    {
        "id": 9,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined",
        "filterMode": "adversarial",
        "answerSelect": "none",
    },
    {
    "id": 10,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined_plus_squad_10k",
        "filterMode": "adversarial",
        "answerSelect": "none",
    },
    {
        "id": 11,
        "adversary": "electra-synqa",
        "generator": "qgen_squad1",
        "filterMode": "uncertain",
        "answerSelect": "none",
    },
    {
        "id": 12,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined",
        "filterMode": "uncertain",
        "answerSelect": "none",
    },
    {
        "id": 13,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined_plus_squad_10k",
        "filterMode": "uncertain",
        "answerSelect": "none",
    },
    {
        "id": 14,
        "adversary": "electra-synqa",
        "generator": "qgen_dcombined_plus_squad_10k",
        "filterMode": "",
        "answerSelect": "enabled",
    },
]

for e_id in experiment_mode_ids:
    this_df = df[df.experiment_mode_id == e_id]
    experiment_mode = experiment_modes[e_id]
    print(f"Experiment Mode ID: {e_id} | {len(this_df)} QAs | {len(this_df.annotator_id.unique())} Annotators")
    print(f"Experiment Mode: {experiment_mode}")
    if len(this_df) > 0:
        print(f"Time taken (s): {np.nanmean(this_df.time_taken_q):.2f} ({np.nanstd(this_df.time_taken_q):.2f})")
        print(f"MER: {(len(this_df[this_df.model_wrong == 1]) / len(this_df)) * 100 :.2f}%")
        # Calculate vMER as indicated by annotators
        print(f"vMER (traditional): {(len(this_df[(this_df.model_wrong == 1) & (this_df.validated_by_annotator == 'valid')]) / len(this_df)) * 100 :.2f}%")
        print(f"Seconds per validated Model-Fooling Example: {np.nansum(this_df.time_taken_q) / len(this_df[(this_df.model_wrong == 1) & (this_df.validated_by_annotator == 'valid')]) :.2f}")
        if experiment_mode["adversary"] != "none":
            print(f"vMER (annotator): {(len(this_df[(this_df.validated_by_annotator == 'valid')]) / len(this_df)) * 100 :.2f}%")
        print(f"Generations per Q (all): {this_df.num_generations.mean():.2f}")
        print(f"Generations per Q (cached): {this_df.num_generations_cached.mean():.2f}")
        print(f"Generations per Q (generated): {this_df.num_generations_generated.mean():.2f}")
    print('='*10)


# We validate A SAMPLE of the model fooling examples that have not yet been validated
# Load and combine
try:
    df_val = pd.read_pickle(val_file_path)
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

# Check how many to manually validate per annotator
annotator_ids = df_val.annotator_id.unique().tolist()
examples_per_annotator = {}
for x in annotator_ids:
    examples_per_annotator[x] = {
        "validated": len(df_val[(df_val.annotator_id == x) & (df_val.val_approved != "empty")]),
        "total": len(df_val[df_val.annotator_id == x]),
    }
    examples_per_annotator[x]["num_to_validate"] = 1 if examples_per_annotator[x]["total"] > 20 else 1
    examples_per_annotator[x]["num_to_validate"] -= examples_per_annotator[x]["validated"]
    examples_per_annotator[x]["num_to_validate"] = max(0, examples_per_annotator[x]["num_to_validate"])

# pprint(examples_per_annotator)


# # Find weird examples
# weird_annotator_id_counts = {}
# for i, row in df_val.iterrows():
#     # if row.text[:5] == row.text[:5].upper():
#     if row.text.count("   ") >= 2:
#         weird_annotator_id_counts[row.annotator_id] = weird_annotator_id_counts.get(row.annotator_id, 0) + 1
# pprint(weird_annotator_id_counts)
# print('---')
# # Showing examples for weird annotators
# for i, row in df_val.iterrows():
#     if row.annotator_id not in weird_annotator_id_counts or row.validated_by_annotator != "valid":
#         continue
#     print("---")
#     print(f"Annotator ID: {row.annotator_id} | Weird count: {weird_annotator_id_counts[row.annotator_id]}")
#     print(row.experiment_mode)
#     print("---")
#     print(
#         row["context_text"].replace(row["target_pred"], row["target_pred"].upper())
#     )
#     print("---")
#     print(f"Q: {row['text']}")
#     print(f"Human ans: {row['target_pred']}")
#     print(f"Model ans: {row['model_preds'].split('|')[-1]}")
#     print("---")

# raise BaseException


if RUN_VALIDATION:
    # Validate the ones that the turkers have told us are valid
    df_to_val = df_val.loc[
        (df_val["model_name"] != "none") & 
        (df_val["validated_by_annotator"] == "valid") & (df_val["val_approved"] == "empty")
    ]

    # for i, row in df_to_val.sample(frac=1, random_state=RANDOM_SEED).iterrows():
    for i, row in df_to_val.iterrows():
        if examples_per_annotator[row["annotator_id"]]["num_to_validate"] <= 0:
            continue

        print(
            "{} examples requiring validation".format(
                min(sum(examples_per_annotator[x]["num_to_validate"] for x in annotator_ids),
                len(df_val.loc[(df_val["model_name"] != "none") & (df_val["validated_by_annotator"] == "valid") & (df_val["val_approved"] == "empty")]))
            )
        )
        print("---")
        print(f'Annotator ID: {row.annotator_id} | {examples_per_annotator[row["annotator_id"]]["total"]} QAs')
        print(row.experiment_mode)
        print("---")
        print(
            row["context_text"].replace(row["target_pred"], row["target_pred"].upper()).replace(row['model_preds'].split('|')[-1], row['model_preds'].split('|')[-1].upper())
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

            if ANNOTATE_QUESTION_TYPES:
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

        # Update the per-annotator counts
        examples_per_annotator[row["annotator_id"]]["num_to_validate"] -= 1
        print(f'Examples left to validate for annotator {row.annotator_id}: {examples_per_annotator[row["annotator_id"]]["num_to_validate"]}')

        # Save the validation df
        df_val.to_pickle(val_file_path)
        df_val.to_csv(val_file_path.replace('.pkl', '.csv'), index=False)
        time.sleep(0.2)
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
if SAVE_FOOLING_EXAMPLES:
    df_model_fooling = df.loc[
        (df["model_wrong"] == True) & (df["val_approved"] == "yes")
    ]
    df_model_fooling.to_csv("annotated_data/model_fooling_examples.csv", index=False)


# # # Print specific context
# # context_text = """Until 1932 the generally accepted length of the Rhine was
# # 1,230 kilometres (764 miles). In 1932 the German encyclopedia Knaurs Lexiko"""
# # for i, row in df.iterrows():
# #     if context_text in row['context_text']:
# #         print(row['context_text'])
# #         print('---')
# #         print(f"Q: {row['text']}")
# #         print(f"Human ans: {row['target_pred']}")
# #         print(f"Model ans: {row['model_preds'].split('|')[-1]}")
# #         raise BaseException

# # Loop through model_names and get stats
# # model_names = df['model_name'].unique()
# model_names = ["roberta_r1", "roberta_r2", "roberta_r2_synthq", "roberta_r2_synthq_ext"]

# annotators_to_remove = [
#     k for k, v in df["annotator_id"].value_counts().items() if v < 5
# ]
# for model_name in model_names:
#     df_temp = df.loc[
#         (df["model_name"] == model_name)
#         & (~df["annotator_id"].isin(annotators_to_remove))
#     ]
#     num_examples = len(df_temp)
#     num_fooling_examples = len(df_temp.loc[df_temp["model_wrong"] == True])
#     num_non_fooling_examples = len(df_temp.loc[df_temp["model_wrong"] == False])
#     num_verified_fooling_examples = len(
#         df_temp.loc[
#             (df_temp["model_wrong"] == True)
#             & (
#                 (df_temp["val_approved"] == "yes")
#                 | (df_temp["val_approved"] == "empty")
#             )
#         ]
#     )
#     num_verified_examples = num_verified_fooling_examples + num_non_fooling_examples
#     num_annotators = len(df_temp["annotator_id"].unique())
#     mer = 100 * num_fooling_examples / num_examples
#     vmer = 100 * num_verified_fooling_examples / num_verified_examples

#     # Get durations
#     worker_ids = [
#         x for x in df_temp["annotator_id"].unique() if x not in annotators_to_remove
#     ]

#     num_annotators = len(worker_ids)
#     num_examples_by_annotator = [
#         len(df_temp.loc[df_temp["annotator_id"] == w_id]) for w_id in worker_ids
#     ]
#     num_verified_examples_by_annotator = [
#         len(
#             df_temp.loc[
#                 (df_temp["annotator_id"] == w_id)
#                 & (
#                     (df_temp["val_approved"] == "yes")
#                     | (df_temp["val_approved"] == "empty")
#                 )
#             ]
#         )
#         for w_id in worker_ids
#     ]

#     num_fooling_examples_by_annotator = [
#         len(
#             df_temp.loc[
#                 (df_temp["annotator_id"] == w_id) & (df_temp["model_wrong"] == True)
#             ]
#         )
#         for w_id in worker_ids
#     ]
#     num_verified_fooling_examples_by_annotator = [
#         len(
#             df_temp.loc[
#                 (df_temp["annotator_id"] == w_id)
#                 & (df_temp["model_wrong"] == True)
#                 & (
#                     (df_temp["val_approved"] == "yes")
#                     | (df_temp["val_approved"] == "empty")
#                 )
#             ]
#         )
#         for w_id in worker_ids
#     ]

#     mer_by_annotator = [
#         100 * x / y
#         for x, y in zip(num_fooling_examples_by_annotator, num_examples_by_annotator)
#     ]
#     vmer_by_annotator = [
#         100 * x / y
#         for x, y in zip(
#             num_verified_fooling_examples_by_annotator,
#             num_verified_examples_by_annotator,
#         )
#         if y > 0
#     ]

#     macro_mer = np.mean(mer_by_annotator)
#     macro_vmer = np.mean(vmer_by_annotator)

#     print(f"Model: {model_name}")
#     print(f"Num Unique Annotators: {num_annotators}")
#     print(f"Num Verified Unique Annotators: {len(vmer_by_annotator)}")
#     print(f"Num Examples: {num_examples}")
#     print(f"Num Verified Examples: {num_verified_examples}")
#     print(f"Num Fooling Examples: {num_fooling_examples}")
#     print(f"Num Verified Fooling Examples: {num_verified_fooling_examples}")
#     print(f"Num Examples / Annotator: {num_examples / num_annotators:.1f}")
#     print("--")
#     print(f"MER: {mer:.4f}%")
#     print(f"vMER: {vmer:.4f}%")
#     print(f"Macro MER: {macro_mer:.4f}%")
#     print(f"Macro vMER: {macro_vmer:.4f}%")
#     print("=====")
