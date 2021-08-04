# Copyright (c) Facebook, Inc. and its affiliates.

"""
Steps to push task specific info into the db
"""

from yoyo import step


__depends__ = {"20210630_01_ZczVK-make-task-code-required"}

steps = [
    step("ALTER TABLE tasks ADD COLUMN input_io_def TEXT"),
    step(
        """UPDATE tasks SET input_io_def='[{"name": "hypothesis", "type": "string", "constructor_args": {"placeholder": "Enter hypothesis..."}}]' WHERE shortname in ('DK_NLI', 'NLI')"""
    ),
    step(
        """UPDATE tasks SET input_io_def='[{"name": "statement", "type": "string", "constructor_args": {"placeholder": "Enter statement..."}}]' WHERE shortname in ('Sentiment', 'Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET input_io_def='[{"name": "question", "type": "string", "constructor_args": {"placeholder": "Enter question..."}}]' WHERE shortname in ('QA', 'DK_QA', 'UCL_QA', 'VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET input_io_def='[{"name": "sourceText", "type": "string", "constructor_args": {"placeholder": "Enter source text..."}}]' WHERE shortname in ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN output_io_def TEXT"),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "label", "type": "goal_message_multiple_choice", "constructor_args": {"labels": ["entailed", "neutral", "contradictory"]}}]' WHERE shortname in ('DK_NLI', 'NLI')"""
    ),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "label", "type": "goal_message_multiple_choice", "constructor_args": {"labels": ["hateful", "not-hateful"]}}]' WHERE shortname in ('Hate Speech')"""
    ),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "label", "type": "goal_message_multiple_choice", "constructor_args": {"labels": ["positive", "negative", "neutral"]}}]' WHERE shortname in ('Sentiment')"""
    ),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "answer", "type": "string", "constructor_args": {"placeholder": "Enter answer..."}}]' WHERE shortname in ('VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "answer", "type": "context_string_selection", "constructor_args": {"reference_key": "context"}}]' WHERE shortname in ('QA', 'DK_QA', 'UCL_QA')"""
    ),
    step(
        """UPDATE tasks SET output_io_def='[{"name": "targetText", "type": "string", "constructor_args": {"placeholder": "Enter target text..."}}]' WHERE shortname in ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN context_io_def TEXT"),
    step(
        """UPDATE tasks SET context_io_def='[{"name": "context", "type": "string", "constructor_args": {"placeholder": "Enter context..."}}]' WHERE shortname not in ('VQA', 'VQA-VAL', 'FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE tasks SET context_io_def='[{"name": "image_url", "type": "image_url", "constructor_args": {}}]' WHERE shortname in ('VQA', 'VQA-VAL')"""
    ),
    step(
        """UPDATE tasks SET context_io_def='[
        {"name": "sourceLanguage", "type": "string", "constructor_args": {"placeholder": "Enter source language..."}},
        {"name": "targetLanguage", "type": "string", "constructor_args": {"placeholder": "Enter target language..."}}
    ]' WHERE shortname in ('FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN user_metadata_model_correct_io_def TEXT"),
    step(
        """UPDATE tasks SET user_metadata_model_correct_io_def='[
        {"name": "example explanation", "type": "string", "constructor_args": {"placeholder": "Explain why your example is correct..."}},
        {"name": "model explanation", "type": "string", "constructor_args": {"placeholder": "Explain why you thought the model would make a mistake..."}}
    ]'"""
    ),
    step("ALTER TABLE tasks ADD COLUMN user_metadata_model_wrong_io_def TEXT"),
    step(
        """UPDATE tasks SET user_metadata_model_wrong_io_def='[
        {"name": "example explanation", "type": "string", "constructor_args": {"placeholder": "Explain why your example is correct..."}},
        {"name": "model explanation", "type": "string", "constructor_args": {"placeholder": "Explain why you think the model made a mistake..."}}
    ]'"""
    ),
    step("ALTER TABLE tasks ADD COLUMN model_metadata_io_def TEXT"),
    step(
        """UPDATE tasks SET model_metadata_io_def='[{"name": "prob", "type": "multiple_choice_probs", "constructor_args": {"reference_key": "label"}}]' WHERE shortname not in ('QA','DK_QA', 'UCL_QA', 'VQA', 'VQA-VAL', 'FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step(
        """UPDATE tasks SET model_metadata_io_def='[{"name": "conf", "type": "conf", "constructor_args": {}}]' WHERE shortname in ('QA','DK_QA', 'UCL_QA')"""
    ),
    step(
        """UPDATE tasks SET model_metadata_io_def='[]' WHERE shortname in ('VQA', 'VQA-VAL', 'FLORES-FULL', 'FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN aggregation_metric ENUM('dynascore')"),
    step("ALTER TABLE tasks ADD COLUMN model_wrong_metric TEXT"),
    step(
        "UPDATE tasks SET model_wrong_metric='exact_match' WHERE shortname not in ('QA','DK_QA', 'UCL_QA', 'VQA', 'VQA-VAL')"
    ),
    step(
        "UPDATE tasks SET model_wrong_metric='string_f1' WHERE shortname in ('QA','DK_QA', 'UCL_QA')"
    ),
    step(
        "UPDATE tasks SET model_wrong_metric='ask_user' WHERE shortname in ('VQA', 'VQA-VAL')"
    ),
    step("ALTER TABLE tasks ADD COLUMN instructions TEXT"),
    # TODO: add instructions
    step("ALTER TABLE tasks ADD COLUMN goal_message TEXT"),
    step(
        "UPDATE tasks SET goal_message='enter a question and answer based on the image, such that the model is fooled.' WHERE shortname in ('VQA', 'VQA-VAL')"
    ),
    step(
        "UPDATE tasks SET goal_message='enter a question and select an answer in the context, such that the model is fooled.' WHERE shortname in ('QA', 'DK_QA', 'UCL_QA')"
    ),
    step("ALTER TABLE tasks ADD COLUMN warning_message TEXT"),
    step(
        "UPDATE tasks SET warning_message='This is sensitive content! If you do not want to see any hateful examples, please switch to another task.' WHERE shortname in ('Hate Speech')"
    ),
    step("ALTER TABLE tasks ADD COLUMN instance_type TEXT"),
    step("UPDATE tasks SET instance_type='ml.m5.2xlarge'"),
    step(
        """UPDATE tasks SET instance_type='ml.p2.xlarge' where shortname IN
        ('FLORES-FULL','FLORES-SMALL1', 'FLORES-SMALL2')"""
    ),
    step("ALTER TABLE tasks ADD COLUMN instance_count INT(11) DEFAULT 1"),
    # TODO check
    step("ALTER TABLE tasks ADD COLUMN eval_metrics TEXT"),
    step("UPDATE tasks SET eval_metrics='macro_f1'"),
    # TODO finish
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
    step("ALTER TABLE tasks ADD COLUMN eval_server_id TEXT"),
    step("UPDATE tasks SET eval_server_id='default'"),
    # TODO: finish
    step(
        """UPDATE contexts SET context=JSON_OBJECT("context", context) WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname not in ('VQA', 'VQA-VAL')))"""
    ),
    step(
        """UPDATE contexts SET context=JSON_OBJECT("image_url", context) WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('VQA', 'VQA-VAL')))"""
    ),
    step("ALTER TABLE contexts CHANGE context context_io TEXT"),
    step("ALTER TABLE examples ADD COLUMN input_io TEXT"),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("hypothesis", text) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("question", text) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('VQA', 'VQA-VAL', 'QA', 'UCL_QA')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("statement", text) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET input_io=JSON_OBJECT("statement", text) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step("ALTER TABLE examples ADD COLUMN user_output_io TEXT"),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "entailed") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "neutral") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "contradictory") WHERE target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('NLI', 'DK_NLI')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("answer", target_pred) WHERE (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('VQA', 'VQA-VAL', 'QA', 'UCL_QA')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "not-hateful") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "hateful") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Hate Speech')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "negative") WHERE target_pred=0 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "positive") WHERE target_pred=1 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    step(
        """UPDATE examples SET user_output_io=JSON_OBJECT("label", "neutral") WHERE target_pred=2 AND (cid IN (SELECT id FROM contexts WHERE r_realid IN (SELECT id FROM rounds WHERE tid IN (SELECT id FROM tasks WHERE shortname in ('Sentiment')))))"""
    ),
    # TODO: look at the following
    step("ALTER TABLE examples ADD COLUMN model_output_io TEXT"),
    step("ALTER TABLE examples ADD COLUMN user_metadata_io TEXT"),
    step("ALTER TABLE examples ADD COLUMN model_metadata_io TEXT"),
    step("ALTER TABLE tasks DROP shortname"),
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
