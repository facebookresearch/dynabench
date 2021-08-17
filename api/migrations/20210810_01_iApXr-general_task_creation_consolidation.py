# Copyright (c) Facebook, Inc. and its affiliates.

"""
Steps to push task specific info into the db
"""

from yoyo import step


__depends__ = {"20210806_01_0LQae-adding-limiting-behavior-of-adc-task"}

steps = [
    step(
        "ALTER TABLE validations ADD COLUMN metadata_io TEXT",
        "ALTER TABLE validations DROP metadata_io",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN create_endpoint Boolean",
        "ALTER TABLE tasks DROP create_endpoint",
    ),
    step(
        """UPDATE tasks SET create_endpoint=false WHERE shortname IN
        ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE tasks SET create_endpoint=true WHERE shortname NOT IN
        ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN gpu Boolean", "ALTER TABLE tasks DROP gpu"),
    step(
        """UPDATE tasks SET gpu=true WHERE shortname IN
        ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE tasks SET gpu=false WHERE shortname NOT IN
        ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN torchserve_config TEXT",
        "ALTER TABLE tasks DROP torchserve_config",
    ),
    step(
        """UPDATE tasks SET torchserve_config='{
            "default_response_timeout": 1200,
            "decode_input_request": False,
            "max_request_size": 12853500,
            "max_response_size": 12853500,
        }' WHERE shortname IN ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE tasks SET torchserve_config="{}" WHERE shortname NOT IN
        ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN io_def TEXT", "ALTER TABLE tasks DROP io_def"),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "hypothesis", "type": "string",
                    "constructor_args": {"placeholder": "Enter hypothesis..."}}],
                "target": [{"name": "label", "type": "goal_message_multiple_choice",
                    "constructor_args": {
                        "labels": ["entailed", "neutral", "contradictory"]}}],
                "output": [
                    {"name": "label", "type": "goal_message_multiple_choice",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"]}},
                    {"name": "prob", "type": "multiple_choice_probs",
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
                        "model_wrong": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiple_choice",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_as": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_as": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_as": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_as": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
            ' WHERE shortname in ('DK_NLI', 'NLI', 'LADC')"""
    ),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}}],
                "target": [{"name": "label", "type": "goal_message_multiple_choice",
                    "constructor_args": {
                        "labels": ["not-hateful", "hateful"]}}],
                "output": [
                    {"name": "label", "type": "goal_message_multiple_choice",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"]}},
                    {"name": "prob", "type": "multiple_choice_probs",
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
                        "model_wrong": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiple_choice",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_as": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_as": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_as": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_as": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
            ' WHERE shortname in ('Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}}],
                "target": [{"name": "label", "type": "goal_message_multiple_choice",
                    "constructor_args": {
                        "labels": ["negative", "positive", "neutral"]}}],
                "output": [
                    {"name": "label", "type": "goal_message_multiple_choice",
                        "constructor_args": {
                            "labels": ["negative", "positive", "neutral"]}},
                    {"name": "prob", "type": "multiple_choice_probs",
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
                        "model_wrong": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiple_choice",
                        "constructor_args": {
                            "labels": ["negative", "positive", "entailed"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_as": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_as": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_as": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_as": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
            ' WHERE shortname in ('Sentiment')"""
    ),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}}],
                "target": [{"name": "answer", "type": "context_string_selection",
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
                        "model_wrong": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_answer",
                        "type": "context_string_selection",
                        "constructor_args": {"reference_name": "context"},
                        "validated_as": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_as": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_as": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_as": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
            ' WHERE shortname in ('QA','DK_QA', 'UCL_QA')"""
    ),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [{"name": "image_url", "type": "image_url",
                    "constructor_args": {}, "display_name": "image"}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}}],
                "target": [],
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
                                "model_wrong": true,
                                "display_name": "answer"}
                    ],
                    "validate":
                    [
                        {"name": "is_question_valid",
                        "type": "multiple_choice",
                        "constructor_args": {
                            "labels": ["yes", "no"],
                            "placeholder": "Is the question even valid?"
                            },
                        "validated_as": "incorrect"}
                    ]
                }
            }
            ' WHERE shortname in ('VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET io_def='
            {
                "context": [
                    {"name": "sourceLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter source language..."}},
                    {"name": "targetLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter target language..."}}],
                "input": [{"name": "sourceText", "type": "string",
                    "constructor_args": {"placeholder": "Enter source text..."}}],
                "target": [
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "output": [
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "metadata": {"create": [], "validate": []}
            }
            ' WHERE shortname in ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN aggregation_metric ENUM('dynascore')",
        "ALTER TABLE tasks DROP aggregation_metric",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN model_wrong_metric TEXT",
        "ALTER TABLE tasks DROP model_wrong_metric",
    ),
    step(
        """UPDATE tasks SET model_wrong_metric='{"type": "exact_match", "constructor_args": {}}'
        WHERE shortname not in ('QA','DK_QA', 'UCL_QA', 'VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET model_wrong_metric='{"type": "string_f1",
        "constructor_args": {"threshold": 0.9}}' WHERE shortname in
        ('QA','DK_QA', 'UCL_QA')"""
    ),
    step(
        """UPDATE tasks SET model_wrong_metric='{"type": "ask_user",
        "constructor_args": {}}' WHERE shortname in ('VQA', 'VQA-VAL')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN instructions TEXT",
        "ALTER TABLE tasks DROP instructions",
    ),
    step(
        """
    UPDATE tasks SET instructions='Find an example that the model gets wrong but
    that another person would get right.'
    """
    ),
    step(
        """
        UPDATE tasks SET instructions='You will be presented with a passage of text,"""
        + """ for which you should ask questions that the AI cannot answer correctly """
        + """but that another person would get right. After entering the question, """
        + """select the answer by highlighting the words that best answer the """
        + """question in the passage.\n\nTry to come up with creative ways to beat """
        + """the AI, and if you notice any consistent failure modes, please be """
        + """sure to let us know in the explanation section!\n\nTry to ensure """
        + """that:\n1. Questions must have only one valid answer in the passage\n2. """
        + """The shortest span which correctly answers the question is selected\n3. """
        + """Questions can be correctly answered from a span in the passage and DO """
        + """NOT require a Yes or No answer\n4. Questions can be answered from the """
        + """content of the passage and DO NOT rely on expert external """
        + """knowledge\n5. DO NOT ask questions about the passage structure such """
        + """as "What is the third word in the passage?"' WHERE shortname IN ('QA')
        """
    ),
    step(
        """
        UPDATE tasks SET instructions='For the purposes of this task we define """
        + """hate speech as follows:\n\nA direct or indirect attack on people """
        + """based on characteristics, including ethnicity, race, nationality, """
        + """immigration status, religion, caste, sex, gender identity, sexual """
        + """orientation, and disability or disease. We define attack as """
        + """violent or dehumanizing (comparing people to non-human things, """
        + """e.g. animals) speech, statements of inferiority, and calls for """
        + """exclusion or segregation. Mocking hate crime is also considered """
        + """hate speech. Attacking individuals/famous people is allowed if the """
        + """attack is not based on any of the protected characteristics listed """
        + """in the definition. Attacking groups perpetrating hate (e.g. """
        + """terrorist groups) is also not considered hate.\n\nNote that, if """
        + """this wasn\\'t already abundantly clear: this hate speech """
        + """definition, and the hate speech model used in the loop, do not in """
        + """any way reflect Facebook\\'s (or anyone else\\'s) policy on hate """
        + """speech.' WHERE shortname IN ('Hate Speech')
        """
    ),
    step(
        """
        UPDATE tasks SET instructions='Your objective is to come up with a """
        + """statement that is either positive, neutral or negative, in such a """
        + """way that you fool the model. Your statement should be classified """
        + """correctly by another person!\n\nTry to come up with creative ways """
        + """to fool the model. The prompt is meant as a starting point to give """
        + """you inspiration.' WHERE shortname IN ('Sentiment')
        """
    ),
    step(
        """
        UPDATE tasks SET instructions='You will be presented with a label and a """
        + """passage of text. Assuming the passage is true, please write another """
        + """passage that is paired with the first via the label (either """
        + """"entailment", "neutral", or "contradiction").\n\nWrite your passage """
        + """so another person will be able to guess the correct label, but the """
        + """AI will be fooled!\n\nTry to come up with creative ways to beat the """
        + """AI! If you notice any consistent AI failure modes, please share them """
        + """in the "explanation of model failure" field! If you would like to """
        + """explain why you are right and the model is wrong, please add that """
        + """information in the "explanation of label" field!\n\nTry to ensure """
        + """that:\n1. Your passage contains at least one complete sentence.\n2. """
        + """Your passage cannot be related to the provided text by any label """
        + """other than the provided one (remember, you can always retract """
        + """mistakes!).\n3. You do not refer to the passage structure itself, """
        + """such as "the third word of the passage is \\'the\\'".\n4. You do not """
        + """refer to or speculate about the author of the passage, but instead """
        + """focus only on its content.\n5. Your passage does not require any """
        + """expert external knowledge not provided.\n6. Your spelling is """
        + """correct.' WHERE shortname IN ('NLI', 'LADC', 'DK_NLI')
        """
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN goal_message TEXT",
        "ALTER TABLE tasks DROP goal_message",
    ),
    step(
        """UPDATE tasks SET goal_message='enter a question and answer based on
            the image, such that the model is fooled.' WHERE shortname in
            ('VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET goal_message='enter a question and select an answer
        in the context, such that the model is fooled.' WHERE shortname in
        ('QA', 'DK_QA', 'UCL_QA')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN warning_message TEXT",
        "ALTER TABLE tasks DROP warning_message",
    ),
    step(
        """UPDATE tasks SET warning_message='This is sensitive content! If you
        do not want to see any hateful examples, please switch to another task.'
        WHERE shortname in ('Hate Speech')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN instance_type TEXT",
        "ALTER TABLE tasks DROP instance_type",
    ),
    step("UPDATE tasks SET instance_type='ml.m5.2xlarge'"),
    step(
        """UPDATE tasks SET instance_type='ml.p2.xlarge' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN instance_count INT(11) DEFAULT 1",
        "ALTER TABLE tasks DROP instance_count",
    ),
    step(
        """UPDATE tasks SET instance_count=16 WHERE shortname IN
        ('FLORES-FULL')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN eval_metrics TEXT",
        "ALTER TABLE tasks DROP eval_metrics",
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN perf_metric TEXT",
        "ALTER TABLE tasks DROP perf_metric",
    ),
    step(
        """UPDATE tasks SET perf_metric='macro_f1', eval_metrics='macro_f1'
        WHERE shortname IN ('Sentiment', 'Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET perf_metric='squad_f1', eval_metrics='squad_f1'
        WHERE shortname IN ('QA', 'UCL_QA', 'DK_QA', 'VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET perf_metric='accuracy', eval_metrics='accuracy' WHERE
        shortname IN ('DK_NLI', 'NLI', 'LADC')"""
    ),
    step(
        """UPDATE tasks SET perf_metric='sp_bleu', eval_metrics='sp_bleu' WHERE
        shortname IN ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN delta_metrics TEXT",
        "ALTER TABLE tasks DROP delta_metrics",
    ),
    step(
        """UPDATE tasks SET delta_metrics='fairness|robustness' WHERE shortname NOT
        IN ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN aws_region TEXT",
        "ALTER TABLE tasks DROP aws_region",
    ),
    step("UPDATE tasks SET aws_region='us-west-1'"),
    step(
        """UPDATE tasks SET aws_region='us-west-2' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN s3_bucket TEXT",
        "ALTER TABLE tasks DROP s3_bucket",
    ),
    step("UPDATE tasks SET s3_bucket='evaluation-us-west-1-096166425824'"),
    step(
        """UPDATE tasks SET s3_bucket='evaluation-us-west-2' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        "ALTER TABLE tasks ADD COLUMN eval_server_id TEXT",
        "ALTER TABLE tasks DROP eval_server_id",
    ),
    step("UPDATE tasks SET eval_server_id='default'"),
    step(
        """UPDATE tasks SET eval_server_id='flores101' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE contexts SET context=JSON_OBJECT("context", context) WHERE
        r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks
        WHERE shortname not in ('VQA', 'VQA-VAL')))""",
        """UPDATE contexts SET context=JSON_EXTRACT(context, '$.context') WHERE
        r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks
        WHERE shortname not in ('VQA', 'VQA-VAL')))""",
    ),
    step(
        """UPDATE contexts SET context=JSON_OBJECT("image_url", context) WHERE
        r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        shortname in ('VQA', 'VQA-VAL')))""",
        """UPDATE contexts SET context=JSON_EXTRACT(context, '$.image_url') WHERE
        r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        shortname in ('VQA', 'VQA-VAL')))""",
    ),
    step(
        "ALTER TABLE contexts CHANGE context context_io TEXT",
        "ALTER TABLE contexts CHANGE context_io context TEXT",
    ),
    step(
        "ALTER TABLE examples ADD COLUMN input_io TEXT",
        "ALTER TABLE examples DROP input_io",
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("hypothesis", text) WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('NLI', 'LADC', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("question", text) WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('VQA', 'VQA-VAL', 'QA', 'UCL_QA')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("statement", text) WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("statement", text) WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        "ALTER TABLE examples ADD COLUMN target_io TEXT",
        "ALTER TABLE examples DROP target_io",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "entailed") WHERE
        target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('NLI', 'LADC', 'DK_NLI')))))""",
        """UPDATE examples SET target_pred=0 WHERE target_io=JSON_OBJECT("label", "entailed")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('nli', 'ladc', 'dk_nli')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "neutral") WHERE
        target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('NLI', 'LADC', 'DK_NLI')))))""",
        """UPDATE examples SET target_pred=1 WHERE target_io=JSON_OBJECT("label", "neutral")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('nli', 'ladc', 'dk_nli')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "contradictory")
        WHERE target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid
        IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('NLI', 'LADC', 'DK_NLI')))))""",
        """UPDATE examples SET target_pred=2 WHERE target_io=JSON_OBJECT("label",
        "contradictory") AND (cid IN (SELECT id FROM contexts WHERE r_realid
        IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('nli', 'ladc', 'dk_nli')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("answer", target_pred) WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('QA', 'UCL_QA', 'VQA',
        'VQA-VAL')))))""",
        """UPDATE examples SET target_pred=JSON_EXTRACT(target_io, '$.answer') WHERE
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE task_code in ('qa', 'ucl_qa',
        'vqa', 'vqa_val')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "not-hateful") WHERE
        target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT
        id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('Hate Speech')))))""",
        """UPDATE examples SET target_pred=0 WHERE target_io=JSON_OBJECT("label", "not-hateful")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT
        id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code in
        ('hs')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "hateful") WHERE
        target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('Hate Speech')))))""",
        """UPDATE examples SET target_pred=1 WHERE target_io=JSON_OBJECT("label", "hateful")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('hs')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "negative") WHERE
        target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('Sentiment')))))""",
        """UPDATE examples SET target_pred=0 WHERE target_io=JSON_OBJECT("label", "negative")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('sentiment')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "positive") WHERE
        target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        shortname in ('Sentiment')))))""",
        """UPDATE examples SET target_pred=1 WHERE target_io=JSON_OBJECT("label",
        "positive") AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE
        task_code in ('sentiment')))))""",
    ),
    step(
        """UPDATE examples SET target_io=JSON_OBJECT("label", "neutral") WHERE
        target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname
        in ('Sentiment')))))""",
        """UPDATE examples SET target_pred=2 WHERE target_io=JSON_OBJECT("label", "neutral")
        AND (cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code
        in ('sentiment')))))""",
    ),
    step(
        "ALTER TABLE examples ADD COLUMN output_io TEXT",
        "ALTER TABLE examples DROP output_io",
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "entailed", "prob",
        JSON_OBJECT("entailed", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)), "contradictory", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1) >=
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('NLI', 'LADC', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "neutral", "prob",
        JSON_OBJECT("entailed", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)), "contradictory", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1) >=
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM
        rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('NLI', 'LADC', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "contradictory",
        "prob", JSON_OBJECT("entailed", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 1), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)), "contradictory", (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM
        rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('NLI', 'LADC', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("answer", (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)))
        WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id
        FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('QA', 'UCL_QA')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("answer", (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)), "prob",
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)))
        WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM
        rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('VQA', 'VQA-VAL')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "not-hateful", "prob",
        JSON_OBJECT("not-hateful", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "hateful", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)))) WHERE (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 1), '|', -1) >= SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND (cid IN (SELECT
        id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid
        IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "hateful", "prob",
        JSON_OBJECT("not-hateful", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "hateful", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)))) WHERE (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 1), '|', -1) <= SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND (cid IN (SELECT
        id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid
        IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "negative", "prob",
        JSON_OBJECT("negative", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "positive", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1) >=
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "positive", "prob",
        JSON_OBJECT("negative", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "positive", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1) >=
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds
        WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET output_io=JSON_OBJECT("label", "neutral", "prob",
        JSON_OBJECT("negative", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds,
        '|', 1), '|', -1)), "positive", (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(
        model_preds, '|', 2), '|', -1)), "neutral", (SELECT SUBSTRING_INDEX(
        SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)))) WHERE (SELECT
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1) >=
        SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 1), '|', -1)) AND
        (SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 3), '|', -1)
        >= SUBSTRING_INDEX(SUBSTRING_INDEX(model_preds, '|', 2), '|', -1)) AND
        (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM
        rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('Sentiment')))))"""
    ),
    step(
        "ALTER TABLE examples ADD COLUMN metadata_io TEXT",
        "ALTER TABLE examples DROP metadata_io",
    ),
    step(
        """UPDATE examples SET metadata_io=JSON_OBJECT("example explanation",
        example_explanation, "model explanation", model_explanation)"""
    ),
    step(
        """UPDATE examples SET metadata_io=JSON_OBJECT("target_answer", target_pred)
        WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM
        rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in
        ('VQA', 'VQA-VAL')))))"""
    ),
    step("", "UPDATE tasks SET shortname='placeholder' where task_code='placeholder'"),
    step("", "UPDATE tasks SET shortname='NLI' where task_code='nli'"),
    step("", "UPDATE tasks SET shortname='QA' where task_code='qa'"),
    step("", "UPDATE tasks SET shortname='Sentiment' where task_code='sentiment'"),
    step("", "UPDATE tasks SET shortname='Hate Speech' where task_code='hs'"),
    step("", "UPDATE tasks SET shortname='DK_NLI' where task_code='dk_nli'"),
    step("", "UPDATE tasks SET shortname='DK_QA' where task_code='dkqa'"),
    step("", "UPDATE tasks SET shortname='YN' where task_code='yn'"),
    step("", "UPDATE tasks SET shortname='VQA' where task_code='vqa'"),
    step("", "UPDATE tasks SET shortname='UCL_QA' where task_code='ucl_qa'"),
    step("", "UPDATE tasks SET shortname='VQA-VAL' where task_code='vqa_val'"),
    step("", "UPDATE tasks SET shortname='VQA' where task_code='flores_small1'"),
    step("", "UPDATE tasks SET shortname='VQA' where task_code='flores_small2'"),
    step("", "UPDATE tasks SET shortname='VQA' where task_code='flores_full'"),
    step(
        "ALTER TABLE tasks DROP shortname",
        "ALTER TABLE tasks ADD COLUMN shortname VARCHAR(255)",
    ),
    step("", "UPDATE tasks SET type='clf' where task_code='placeholder'"),
    step("", "UPDATE tasks SET type='clf' where task_code='nli'"),
    step("", "UPDATE tasks SET type='extract' where task_code='qa'"),
    step("", "UPDATE tasks SET type='clf' where task_code='sentiment'"),
    step("", "UPDATE tasks SET type='clf' where task_code='hs'"),
    step("", "UPDATE tasks SET type='clf' where task_code='dk_nli'"),
    step("", "UPDATE tasks SET type='extract' where task_code='dkqa'"),
    step("", "UPDATE tasks SET type='clf' where task_code='yn'"),
    step("", "UPDATE tasks SET type='VQA' where task_code='vqa'"),
    step("", "UPDATE tasks SET type='extract' where task_code='ucl_qa'"),
    step("", "UPDATE tasks SET type='clf' where task_code='vqa_val'"),
    step("", "UPDATE tasks SET type='seq2seq' where task_code='flores_small1'"),
    step("", "UPDATE tasks SET type='seq2seq' where task_code='flores_small2'"),
    step("", "UPDATE tasks SET type='seq2seq' where task_code='flores_full'"),
    step(
        "ALTER TABLE tasks DROP type", "ALTER TABLE tasks ADD COLUMN type VARCHAR(255)"
    ),
    step(
        "ALTER TABLE tasks DROP owner_str",
        "ALTER TABLE tasks ADD COLUMN owner_str TEXT",
    ),
    step(
        "ALTER TABLE tasks DROP longdesc", "ALTER TABLE tasks ADD COLUMN longdesc TEXT"
    ),
    step(
        "",
        """UPDATE tasks SET targets='na' where task_code in ('flores_full',
         'flores_small1', 'flores_small2', 'vqa_val', 'ucl_qa', 'vqa', 'yn',
         'dkqa', 'qa')""",
    ),
    step(
        "",
        """UPDATE tasks SET targets='entailed|neutral|contradictory'
         where task_code in ('nli', 'dk_nli')""",
    ),
    step(
        "",
        """UPDATE tasks SET targets='negative|positive|neutral' where
        task_code='sentiment'""",
    ),
    step("", "UPDATE tasks SET targets='not-hateful|hateful' where task_code='hs'"),
    step("ALTER TABLE tasks DROP targets", "ALTER TABLE tasks ADD COLUMN targets TEXT"),
    step(
        "ALTER TABLE tasks DROP score_progression",
        "ALTER TABLE tasks ADD COLUMN score_progression TEXT",
    ),
    step(
        "ALTER TABLE tasks DROP total_verified",
        "ALTER TABLE tasks ADD COLUMN total_verified INT(11) DEFAULT 0",
    ),
    step(
        "ALTER TABLE tasks DROP total_collected",
        "ALTER TABLE tasks ADD COLUMN total_collected INT(11) DEFAULT 0",
    ),
    step(
        "",
        """UPDATE tasks SET has_context=0 where task_code in ('hs', 'sentiment',
         'vqa_val', 'flores_small1', 'flores_small2', 'flores_full', 'yn')""",
    ),
    step(
        "",
        """UPDATE tasks SET has_context=1
         where task_code in ('nli', 'qa', 'sentiment', 'dk_nli', 'dkqa', 'vqa',
         'ucl_qa')""",
    ),
    step(
        "ALTER TABLE tasks DROP has_context",
        "ALTER TABLE tasks ADD COLUMN has_context BOOL",
    ),
    step(
        "",
        """UPDATE tasks SET has_answer=0 where task_code not in
            ('qa', 'dkqa', 'vqa', 'ucl_qa')""",
    ),
    step(
        "",
        """UPDATE tasks SET has_answer=1 where task_code in
            ('qa', 'dkqa', 'vqa', 'ucl_qa')""",
    ),
    step(
        "ALTER TABLE tasks DROP has_answer",
        "ALTER TABLE tasks ADD COLUMN has_answer BOOL",
    ),
    step(
        "ALTER TABLE examples CHANGE target_model model_endpoint_name TEXT",
        "ALTER TABLE examples CHANGE model_endpoint_name model_endpoint_name TEXT",
    ),
    step(
        "ALTER TABLE examples DROP target_pred",
        "ALTER TABLE examples ADD COLUMN target_pred TEXT",
    ),
    step(
        "",
        """UPDATE examples SET model_preds=CONCAT(JSON_EXTRACT(JSON_EXTRACT(output_io,
        "$.prob"), "$.entailed"), "|", JSON_EXTRACT(JSON_EXTRACT(output_io, "$.prob"),
        "$.neutral"), "|", JSON_EXTRACT(JSON_EXTRACT(output_io, "$.prob"),
        "$.contradictory")) WHERE cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code in
        ('nli', 'ladc', 'dk_nli'))))""",
    ),
    step(
        "",
        """UPDATE examples SET model_preds=CONCAT(JSON_EXTRACT(JSON_EXTRACT(output_io,
        "$.prob"), '$."not-hateful"'), "|", JSON_EXTRACT(JSON_EXTRACT(output_io,
        "$.prob"), "$.hateful")) WHERE cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code in
        ('hs'))))""",
    ),
    step(
        "",
        """UPDATE examples SET model_preds=CONCAT(JSON_EXTRACT(JSON_EXTRACT(output_io,
        "$.prob"), "$.negative"), "|", JSON_EXTRACT(JSON_EXTRACT(output_io, "$.prob"),
        "$.positive"), "|", JSON_EXTRACT(JSON_EXTRACT(output_io, "$.prob"),
        "$.neutral")) WHERE cid IN (SELECT id FROM contexts WHERE r_realid IN
        (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE task_code in
        ('sentiment'))))""",
    ),
    step(
        "",
        """UPDATE examples SET model_preds=CONCAT(JSON_EXTRACT(output_io, "$.conf"),
        "|", JSON_EXTRACT(output_io, "$.answer")) WHERE cid IN (SELECT id FROM
        contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT
        id FROM tasks WHERE task_code in ('qa', 'ucl_qa'))))
        """,
    ),
    step(
        "",
        """UPDATE examples SET model_preds=CONCAT(JSON_EXTRACT(output_io, "$.answer"),
        "|", JSON_EXTRACT(output_io, "$.prob")) WHERE cid IN (SELECT id FROM
        contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT
        id FROM tasks WHERE task_code in ('vqa', 'vqa_val'))))
        """,
    ),
    step(
        "ALTER TABLE examples DROP model_preds",
        "ALTER TABLE examples ADD COLUMN model_preds TEXT",
    ),
    step(
        """UPDATE examples SET example_explanation=JSON_EXTRACT(metadata_io,
        '$."example explanation"')"""
    ),
    step(
        "ALTER TABLE examples DROP example_explanation",
        "ALTER TABLE examples ADD COLUMN example_explanation TEXT",
    ),
    step(
        """UPDATE examples SET model_explanation=JSON_EXTRACT(metadata_io,
        '$."model explanation"')"""
    ),
    step(
        "ALTER TABLE examples DROP model_explanation",
        "ALTER TABLE examples ADD COLUMN model_explanation TEXT",
    ),
]
