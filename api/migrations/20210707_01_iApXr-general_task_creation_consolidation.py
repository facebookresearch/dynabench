# Copyright (c) Facebook, Inc. and its affiliates.

"""

"""

from yoyo import step


__depends__ = {"20210630_01_ZczVK-make-task-code-required"}

steps = [
    step("ALTER TABLE tasks ADD COLUMN aggregation_metric ENUM('dynascore')"),
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
            "type": "multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["entailed", "neutral", "contradictory"]}
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
            "image": {
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
            "constructor_args": {"reference_key": "context"}
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
        "statement": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "label": {
            "type": "multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["hateful", "not-hateful"]}
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
        "statement": {
            "type": "string",
            "location": "input",
            "constructor_args": {}
        },
        "label": {
            "type": "multiple_choice",
            "location": "output",
            "constructor_args": {"labels": ["positive", "neutral", "negative"]}
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
    step("ALTER TABLE tasks ADD COLUMN instance TEXT"),
    step("UPDATE tasks SET instance='ml.m5.2xlarge'"),
    step(
        """UPDATE tasks SET instance='ml.p2.xlarge' where shortname IN
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
        ('QA', 'UCL_QA', 'DK_QA')"""
    ),
    step(
        "UPDATE tasks SET perf_metric='accuracy' WHERE shortname IN ('DK_NLI', 'NLI')"
    ),
    step(
        """UPDATE tasks SET perf_metric='sp_bleu' WHERE shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN delta_metrics TEXT"),
    step("UPDATE tasks SET delta_metrics='fairness|robustness'"),
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
    step("""UPDATE contexts SET context=JSON_OBJECT("context", context)"""),
    step("ALTER TABLE examples CHANGE text io TEXT"),
    step("ALTER TABLE examples ADD COLUMN model_response_io TEXT"),
    step("ALTER TABLE examples CHANGE target_model model_endpoint_name TEXT"),
    step("ALTER TABLE examples DROP target_pred"),
    step("ALTER TABLE examples DROP model_preds"),
]
