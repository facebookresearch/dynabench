# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add metrics to annotation_config_json
"""

from yoyo import step


__depends__ = {"20210826_01_H1Nks-modify-tasks-table"}

steps = [
    step(
        "",
        """UPDATE tasks SET model_wrong_metric='{"type": "exact_match",
        "constructor_args": {"reference_names": ["label"]}}'
        WHERE shortname not in ('QA','DK_QA', 'UCL_QA', 'VQA', 'VQA-VAL')""",
    ),
    step(
        "",
        """UPDATE tasks SET model_wrong_metric='{"type": "string_f1",
        "constructor_args": {"threshold": 0.9, "reference_name": "answer"}}'
        WHERE shortname in ('QA','DK_QA', 'UCL_QA')""",
    ),
    step(
        "",
        """UPDATE tasks SET model_wrong_metric='{"type": "ask_user",
        "constructor_args": {}}' WHERE shortname in ('VQA', 'VQA-VAL')""",
    ),
    step(
        "",
        "ALTER TABLE tasks DROP aggregation_metric",
        "ALTER TABLE tasks ADD COLUMN aggregation_metric ENUM('dynascore')",
    ),
    step(
        "ALTER TABLE tasks DROP model_wrong_metric",
        "ALTER TABLE tasks ADD COLUMN model_wrong_metric TEXT",
    ),
    step(
        "",
        """UPDATE tasks SET perf_metric='macro_f1', eval_metrics='macro_f1'
        WHERE shortname IN ('Sentiment', 'Hate Speech')""",
    ),
    step(
        "",
        """UPDATE tasks SET perf_metric='squad_f1', eval_metrics='squad_f1'
        WHERE shortname IN ('QA', 'UCL_QA', 'DK_QA', 'VQA', 'VQA-VAL')""",
    ),
    step(
        "",
        """UPDATE tasks SET perf_metric='accuracy', eval_metrics='accuracy' WHERE
        shortname IN ('DK_NLI', 'NLI', 'LADC')""",
    ),
    step(
        "",
        """UPDATE tasks SET perf_metric='sp_bleu', eval_metrics='sp_bleu' WHERE
        shortname IN ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')""",
    ),
    step(
        "ALTER TABLE tasks DROP perf_metric",
        "ALTER TABLE tasks ADD COLUMN perf_metric TEXT",
    ),
    step(
        "ALTER TABLE tasks DROP eval_metrics",
        "ALTER TABLE tasks ADD COLUMN eval_metrics TEXT",
    ),
    step(
        "",
        """UPDATE tasks SET delta_metrics='fairness|robustness' WHERE shortname NOT
        IN ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')""",
    ),
    step(
        "ALTER TABLE tasks DROP delta_metrics",
        "ALTER TABLE tasks ADD COLUMN delta_metrics TEXT",
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "accuracy", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "hypothesis", "type": "string",
                    "constructor_args": {"placeholder": "Enter hypothesis..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["entailed", "neutral", "contradictory"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('dk_nli', 'nli', 'ladc')""",
        """UPDATE tasks SET annotation_config_json='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "hypothesis", "type": "string",
                    "constructor_args": {"placeholder": "Enter hypothesis..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["entailed", "neutral", "contradictory"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('dk_nli', 'nli', 'ladc')""",
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "macro_f1", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "content_warning":
        """
        + '"This is sensitive content! If you do not want to see any hateful '
        + 'examples, please switch to another task.", '
        + """
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["not-hateful", "hateful"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('hs')""",
        """UPDATE tasks SET annotation_config_json='
            {
                "content_warning":
        """
        + '"This is sensitive content! If you do not want to see any hateful '
        + 'examples, please switch to another task.", '
        + """
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["not-hateful", "hateful"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('hs')""",
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "macro_f1", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["negative", "positive", "neutral"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["negative", "positive", "neutral"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["negative", "positive", "entailed"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('sentiment')""",
        """UPDATE tasks SET annotation_config_json='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["negative", "positive", "neutral"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["negative", "positive", "neutral"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
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
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["negative", "positive", "entailed"],
                            "placeholder": "Enter corrected label"
                            },
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
            ' WHERE task_code in ('sentiment')""",
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
            {
                "model_wrong_metric": {"type": "string_f1", "constructor_args":
                    {"reference_name": "answer"}},
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
            ' WHERE task_code in ('qa','dk_qa', 'ucl_qa')""",
        """UPDATE tasks SET annotation_config_json='
            {
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
            ' WHERE task_code in ('qa','dk_qa', 'ucl_qa')""",
    ),
    step(
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
        """UPDATE tasks SET annotation_config_json='
            {
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
    step(
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
        """UPDATE tasks SET annotation_config_json='
            {
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
    ),
]
