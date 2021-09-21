# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add reference_name to perf_metric for FLORES
"""

from yoyo import step


__depends__ = {
    "20210916_01_Y97cI-changes_to_support_prediction_upload_and_eval",
    "20210920_01_NIUYK-add-contributed-task-field",
}

steps = [
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "ask_user", "constructor_args": {}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "sp_bleu", "constructor_args":
                    {"reference_name": "targetText"}},
                "delta_metrics": [],
                "context": [
                    {"name": "sourceLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter source language..."}},
                    {"name": "targetLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter target language..."}}],
                "input": [{"name": "sourceText", "type": "string",
                    "constructor_args": {"placeholder": "Enter source text..."}},
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "output": [
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "metadata": {"create": [], "validate": []}
            }
            ' WHERE task_code in ('flores_full', 'flores_small1', 'flores_small2')""",
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "ask_user", "constructor_args": {}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "sp_bleu", "constructor_args": {}},
                "delta_metrics": [],
                "context": [
                    {"name": "sourceLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter source language..."}},
                    {"name": "targetLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter target language..."}}],
                "input": [{"name": "sourceText", "type": "string",
                    "constructor_args": {"placeholder": "Enter source text..."}},
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "output": [
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "metadata": {"create": [], "validate": []}
            }
            ' WHERE task_code in ('flores_full', 'flores_small1', 'flores_small2')""",
    )
]
