# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add threshold to QA perf metric config.
"""

from yoyo import step


__depends__ = {"20210921_01_PD2Yn-add-reference-name-to-perf-metric-for-flores"}

steps = [
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "string_f1", "constructor_args":
                    {"reference_name": "answer", "threshold": 0.9}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "squad_f1", "constructor_args":
                    {"reference_name": "answer"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "goal_message":
"enter a question and select an answer in the context, such that the model is fooled.",
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}},
                    {"name": "answer", "type": "context_string_selection",
                    "constructor_args": {
                        "reference_name": "context"}}],
                "output": [
                    {"name": "answer", "type": "context_string_selection",
                        "constructor_args": {
                            "reference_name": "context"}},
                    {"name": "conf", "type": "conf",
                        "constructor_args": {}}
                ],
                "metadata": {
                "create":
                [
                    {"name": "example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why your example is correct..."},
                        "display_name": "example explanation"},
                    {"name": "model_explanation_right", "type": "string",
                        "constructor_args": {"placeholder":
                        "Explain why you thought the model would make a mistake..."},
                        "model_wrong_condition": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong_condition": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_answer",
                        "type": "context_string_selection",
                        "constructor_args": {"reference_name": "context"},
                        "validated_label_condition": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_label_condition": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_label_condition": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_label_condition": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
            ' WHERE task_code in ('qa','dk_qa', 'ucl_qa')"""
    )
]
