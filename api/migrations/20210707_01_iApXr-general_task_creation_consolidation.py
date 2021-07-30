# Copyright (c) Facebook, Inc. and its affiliates.

"""
Steps to push task specific info into the db
"""

from yoyo import step


__depends__ = {"20210630_01_ZczVK-make-task-code-required"}

steps = [
    step("ALTER TABLE tasks ADD COLUMN aggregation_metric ENUM('dynascore')"),
    step("ALTER TABLE tasks ADD COLUMN goal_message TEXT"),
    step("UPDATE tasks SET goal_message='enter a question and answer based on the image, such that the model is fooled.' WHERE shortname in ('VQA', 'VQA-VAL')"),
    step("UPDATE tasks SET goal_message='enter a question and select an answer in the context, such that the model is fooled.' WHERE shortname in ('QA', 'DK_QA', 'UCL_QA')"),
    step("ALTER TABLE tasks ADD COLUMN instructions TEXT"),
    step("ALTER TABLE tasks ADD COLUMN io_definition TEXT"),
    step(
        """UPDATE tasks SET io_definition='{
        "context": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "hypothesis": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "label": {
            "type": "goal_message_multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["entailed", "neutral", "contradictory"]},
            "special_create_interface_location": "top"
        },
        "prob": {
            "type": "multiple_choice_probs",
            "location": "model_response_info",
            "constructor_args": {"reference_key": "label"}
        }
        }' WHERE shortname in ('DK_NLI', 'NLI')"""
    ),
    step(
        """UPDATE tasks SET io_definition='{
            "image_url": {
                "type": "image_url",
                "location": "context",
                "constructor_args": {}
            },
            "question": {
                "type": "string",
                "location": "input",
                "constructor_args": {}
            },
            "answer": {
                "type": "string",
                "location": "output",
                "constructor_args": {}
            }
        }' WHERE shortname in ('VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET io_definition='{
        "context": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "question": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "answer": {
            "type": "string_selection",
            "location": "output",
            "constructor_args": {"reference_key": "context"},
            "special_create_interface_location": "context"
        },
        "conf": {
            "type": "conf",
            "location": "model_response_info",
            "constructor_args": {}
        }
        }' WHERE shortname in ('QA', 'DK_QA', 'UCL_QA')"""
    ),
    step(
        """UPDATE tasks SET io_definition='{
        "context": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "statement": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "label": {
            "type": "goal_message_multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["hateful", "not-hateful"]},
            "special_create_interface_location": "top"
        },
        "prob": {
            "type": "multiple_choice_probs",
            "location": "model_response_info",
            "constructor_args": {"reference_key": "label"}
        }
        }' WHERE shortname in ('Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET io_definition='{
        "context": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "statement": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "label": {
            "type": "goal_message_multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["positive", "neutral", "negative"]},
            "special_create_interface_location": "top"
        },
        "prob": {
            "type": "multiple_choice_probs",
            "location": "model_response_info",
            "constructor_args": {"reference_key": "label"}
        }
        }' WHERE shortname in ('Sentiment')"""
    ),
    step(
        """UPDATE tasks SET io_definition='{
        "sourceLanguage": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "targetLanguage": {
            "type": "string",
            "location": "context",
            "constructor_args": {}
        },
        "sourceText": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "targetText": {
            "type": "string",
            "location": "output",
            "constructor_args": {}
        }
        }' WHERE shortname in ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN instance_type TEXT"),
    step("UPDATE tasks SET instance_type='ml.m5.2xlarge'"),
    step(
        """UPDATE tasks SET instance_type='ml.p2.xlarge' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN instance_count INT(11) DEFAULT 1"),
    step("ALTER TABLE tasks ADD COLUMN eval_metrics TEXT"),
    step("UPDATE tasks SET eval_metrics='macro_f1'"),
    step("ALTER TABLE tasks ADD COLUMN perf_metric TEXT"),
    step(
        """UPDATE tasks SET perf_metric='macro_f1' WHERE shortname IN
        ('Sentiment', 'Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET perf_metric='squad_f1' WHERE shortname IN
        ('QA', 'UCL_QA', 'DK_QA', 'VQA', 'VQA-VAL')"""
    ),
    step(
        "UPDATE tasks SET perf_metric='accuracy' WHERE shortname IN ('DK_NLI', 'NLI')"
    ),
    step(
        """UPDATE tasks SET perf_metric='sp_bleu' WHERE shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN delta_metrics TEXT"),
    step(
        "UPDATE tasks SET delta_metrics='fairness|robustness' WHERE shortname NOT IN ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"
    ),
    step("ALTER TABLE tasks ADD COLUMN aws_region TEXT"),
    step("UPDATE tasks SET aws_region='us-west-1'"),
    step(
        """UPDATE tasks SET aws_region='us-west-2' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN s3_bucket TEXT"),
    step("UPDATE tasks SET s3_bucket='evaluation-us-west-1-096166425824'"),
    step(
        """UPDATE tasks SET s3_bucket='evaluation-us-west-2' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN model_correct_metric TEXT"),
    step("UPDATE tasks SET model_correct_metric='exact_match'"),
    step(
        """UPDATE contexts SET context=JSON_OBJECT("context", context) WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname not in ('VQA', 'VQA-VAL')))"""
    ),
    step(
        """UPDATE contexts SET context=JSON_OBJECT("image_url", context) WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('VQA', 'VQA-VAL')))"""
    ),
    step("ALTER TABLE examples CHANGE text io TEXT"),
    step(
        """UPDATE examples SET io=JSON_OBJECT("hypothesis", io, "label", "entailed") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("hypothesis", io, "label", "neutral") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("hypothesis", io, "label", "contradictory") WHERE target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("question", io, "answer", target_pred) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('VQA', 'VQA-VAL', 'QA', 'UCL_QA')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("statement", io, "label", "not-hateful") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("statement", io, "label", "hateful") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("statement", io, "label", "negative") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("statement", io, "label", "positive") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET io=JSON_OBJECT("statement", io, "label", "neutral") WHERE target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step("ALTER TABLE tasks DROP shortname"),
    step("ALTER TABLE tasks DROP task_code"),
    step("ALTER TABLE tasks DROP type"),
    step("ALTER TABLE tasks DROP owner_str"),
    step("ALTER TABLE tasks DROP longdesc"),
    step("ALTER TABLE tasks DROP targets"),
    step("ALTER TABLE tasks DROP score_progression"),
    step("ALTER TABLE tasks DROP total_verified"),
    step("ALTER TABLE tasks DROP total_collected"),
    step("ALTER TABLE tasks DROP has_context"),
    step("ALTER TABLE tasks DROP has_answer"),
    step("ALTER TABLE examples ADD COLUMN model_response_io TEXT"),
    step("ALTER TABLE examples CHANGE target_model model_endpoint_name TEXT"),
    step("ALTER TABLE examples DROP target_pred"),
    step("ALTER TABLE examples DROP model_preds"),
]