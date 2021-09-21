# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
VQA Evaluation
"""

from yoyo import step


__depends__ = {"20210915_01_f1gBY-change-round-url-to-nullable-text"}

steps = [
    step(
        "ALTER TABLE tasks ADD COLUMN has_predictions_upload BOOLEAN DEFAULT false",
        "ALTER TABLE tasks DROP has_predictions_upload",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN predictions_upload_instructions_md TEXT",
        "ALTER TABLE tasks DROP predictions_upload_instructions_md",
    ),
    step(
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown", "predictions_upload")
        DEFAULT "unknown"
        """,
        """
        ALTER TABLE models MODIFY deployment_status
        ENUM('uploaded', 'processing', 'deployed',
        'created', 'failed', 'unknown', "takendown")
        DEFAULT "unknown"
        """,
    ),
    step(
        """
        ALTER TABLE models ADD COLUMN evaluation_status
        ENUM('evaluating', 'completed', 'failed', 'pre_evaluation')
        DEFAULT "pre_evaluation"
        """,
        "ALTER TABLE models DROP evaluation_status",
    ),
    step(
        """UPDATE models SET evaluation_status='failed' WHERE
        deployment_status='takendown'"""
    ),
    step(
        """UPDATE models SET evaluation_status='completed' WHERE
        deployment_status in ('created', 'deployed')"""
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "ask_user", "constructor_args": {}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "vqa_accuracy", "constructor_args":
                    {"reference_name": "answer"}},
                "delta_metrics": [],
                "goal_message":
    "enter a question and answer based on the image, such that the model is fooled.",
                "context": [{"name": "image_url", "type": "image_url",
                    "constructor_args": {}, "display_name": "image"}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}}],
                "output": [
                    {"name": "answer", "type": "string",
                        "constructor_args": {"placeholder": "Enter answer..."}}
                ],
                "metadata": {
                    "create":
                    [
                        {"name": "target_answer", "type": "string",
                            "constructor_args": {"placeholder":
                                "The model was wrong, so enter the correct answer..."},
                                "display_name": "answer",
                                "model_wrong_condition": true,
                                "display_name": "answer"}
                    ],
                    "validate":
                    [
                        {"name": "is_question_valid",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["yes", "no"],
                            "placeholder": "Is the question even valid?"
                            },
                        "validated_label_condition": "incorrect"}
                    ]
                }
            }
            ' WHERE task_code in ('vqa', 'vqa_val')""",
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "ask_user", "constructor_args": {}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "squad_f1", "constructor_args":
                    {"reference_name": "answer"}},
                "delta_metrics": [],
                "goal_message":
    "enter a question and answer based on the image, such that the model is fooled.",
                "context": [{"name": "image_url", "type": "image_url",
                    "constructor_args": {}, "display_name": "image"}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}}],
                "output": [
                    {"name": "answer", "type": "string",
                        "constructor_args": {"placeholder": "Enter answer..."}}
                ],
                "metadata": {
                    "create":
                    [
                        {"name": "target_answer", "type": "string",
                            "constructor_args": {"placeholder":
                                "The model was wrong, so enter the correct answer..."},
                                "display_name": "answer",
                                "model_wrong_condition": true,
                                "display_name": "answer"}
                    ],
                    "validate":
                    [
                        {"name": "is_question_valid",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["yes", "no"],
                            "placeholder": "Is the question even valid?"
                            },
                        "validated_label_condition": "incorrect"}
                    ]
                }
            }
            ' WHERE task_code in ('vqa', 'vqa_val')""",
    ),
    step("UPDATE tasks SET has_predictions_upload=1 WHERE task_code='vqa' limit 1"),
]
