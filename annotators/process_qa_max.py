#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.

import json
import pandas as pd


BONUS = 0.50

df = pd.read_json("annotated_data/export.json")
df_new = pd.DataFrame(columns=["agentId", "keep", "bonus"])
agentIds = []
for itr, val in enumerate(df["metadata_json"]):
    val = json.loads(val)
    try:
        agentIds.append(val["agentId"])
    except Exception:
        agentIds.append(float("nan"))
df["agentId"] = agentIds
unique_ids = list(df["agentId"].unique())

keep = []
for agentId in unique_ids:
    temp_df = df[df["agentId"] == agentId]
    temp_df.reset_index(drop=True, inplace=True)
    val_correct = 0
    model_correct = 0

    for itr, vlabel in enumerate(temp_df["validation_labels"]):
        if vlabel and vlabel[0][0] == "correct":
            val_correct += 1
        if temp_df.loc[itr, "model_wrong"]:
            model_correct += 1
    
    if val_correct > 3:
        keep.append("a")
    else:
        keep.append("p")
    sendbonus = model_correct * BONUS

df_new["agentId"] = unique_ids
df_new["keep"] = keep
df_new["bonus"] = sendbonus
df_new.to_csv("annotated_data/export_dkqa.tsv", sep="\t", index=False)
