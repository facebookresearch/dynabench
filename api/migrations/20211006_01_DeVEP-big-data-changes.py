# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Change image_url into image.
"""

from yoyo import step


__depends__ = {"20210929_01_AKPlZ-update-qa-f1-threshold-to-0-4"}

steps = [
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
                "context": [{"name": "image", "type": "image",
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
    ),
    step(
        """UPDATE tasks SET annotation_config_json='
        {
                  "model_wrong_metric": {"type": "exact_match", "constructor_args":
                      {"reference_names": ["label"]}},
                  "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                  "perf_metric": {"type": "macro_f1", "constructor_args":
                      {"reference_name": "label"}},
                  "delta_metrics": [],
                  "context": [
                    {"name": "image", "type": "image", "constructor_args": {}},
                    {"name": "caption-1", "type": "string", "constructor_args":
                        {"placeholder": "Enter caption-1..."}},
                    {"name": "caption-2", "type": "string", "constructor_args":
                        {"placeholder": "Enter caption-2..."}}
                    ],
                  "input": [
                      {"name": "label", "type": "multiclass",
                      "constructor_args": {
                          "labels": ["caption-1", "caption-2"], "placeholder":
                            "Select correct caption"}}],
                  "output": [
                      {"name": "label", "type": "multiclass",
                          "constructor_args": {
                              "labels": ["caption-1", "caption-2"], "placeholder":
                                "Select correct caption"}},
                      {"name": "prob", "type": "multiclass_probs",
                          "constructor_args": {"reference_name": "label"}}
                  ],
                  "metadata": {
                  "create":
                  [],
                  "validate":
                  [
                      {"name": "flag_reason", "type": "string",
                          "constructor_args":
                              {"placeholder": "Enter the reason for flagging..."},
                          "validated_label_condition": "flagged"}
                  ]
                  }
              }
        ' WHERE task_code in ('winoground')""",
        """UPDATE tasks SET annotation_config_json='
            {
                      "model_wrong_metric": {"type": "exact_match", "constructor_args":
                          {"reference_names": ["label"]}},
                      "aggregation_metric": {"type": "dynascore",
                        "constructor_args": {}},
                      "perf_metric": {"type": "macro_f1", "constructor_args":
                          {"reference_name": "label"}},
                      "delta_metrics": [],
                      "context": [
                        {"name": "image", "type": "image_url", "constructor_args": {}},
                        {"name": "caption-1", "type": "string", "constructor_args":
                            {"placeholder": "Enter caption-1..."}},
                        {"name": "caption-2", "type": "string", "constructor_args":
                            {"placeholder": "Enter caption-2..."}}
                        ],
                      "input": [
                          {"name": "label", "type": "multiclass",
                          "constructor_args": {
                              "labels": ["caption-1", "caption-2"], "placeholder":
                                "Select correct caption"}}],
                      "output": [
                          {"name": "label", "type": "multiclass",
                              "constructor_args": {
                                  "labels": ["caption-1", "caption-2"], "placeholder":
                                    "Select correct caption"}},
                          {"name": "prob", "type": "multiclass_probs",
                              "constructor_args": {"reference_name": "label"}}
                      ],
                      "metadata": {
                      "create":
                      [],
                      "validate":
                      [
                          {"name": "flag_reason", "type": "string",
                              "constructor_args":
                                  {"placeholder": "Enter the reason for flagging..."},
                              "validated_label_condition": "flagged"}
                      ]
                      }
                  }
            ' WHERE task_code in ('winoground')""",
    ),
    step(
        """
        UPDATE contexts SET context_json = JSON_INSERT(JSON_REMOVE(context_json,
        '$.image_url'), '$.image', JSON_EXTRACT(context_json, '$.image_url')) WHERE
        r_realid in (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        task_code in ('winoground', 'vqa', 'vqa_val')))
        """,
        """
        UPDATE contexts SET context_json = JSON_INSERT(JSON_REMOVE(context_json,
        '$.image_url'), '$.image', JSON_EXTRACT(context_json, '$.image_url')) WHERE
        r_realid in (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        task_code in ('winoground', 'vqa', 'vqa_val')))
        """,
    ),
]
