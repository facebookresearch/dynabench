# Copyright (c) Facebook, Inc. and its affiliates.

import datetime
import decimal
import json
import os
from urllib.parse import urlparse

import bottle
import sqlalchemy as db
from sqlalchemy.orm import lazyload
from transformers.data.metrics.squad_metrics import compute_f1

import common.auth as _auth
from common.logging import logger


def check_fields(data, fields):
    if not data:
        return False
    for f in fields:
        if f not in data:
            return False
    return True


def _alchemyencoder(obj):
    if (
        isinstance(obj, datetime.date)
        or isinstance(obj, datetime.datetime)
        or isinstance(obj, datetime.time)
    ):
        return obj.isoformat()
    elif isinstance(obj, decimal.Decimal):
        return float(obj)


def json_encode(obj):
    return json.dumps(obj, default=_alchemyencoder)


def check_data_path_exists(path):
    if not os.path.exists(path):
        logger.warning(
            f"Dataset path for {path.split(os.path.sep)[-1]} does not exist "
            f"at {path}. Proceeding with empty dataset!"
        )
        return False
    else:
        return True


# TODO need to change it in future - to read the test data from db of
# config files
def read_nli_round_labels(root_path):
    """
    Load the files from NLI directory and label them automatically
    :param root_path: We assume anli_v0.1 test set present in api folder
    :return: Dict object
    """

    full_path = os.path.join(root_path, "data", "anli_v1.0")

    if not check_data_path_exists(full_path):
        return {}

    r_file_paths = [
        name
        for name in os.listdir(full_path)
        if os.path.isdir(os.path.join(full_path, name))
    ]
    nli_labels = {}
    for r_file_path in r_file_paths:
        r_num = r_file_path[len(r_file_path) - 1 : len(r_file_path)]
        r_file_path = full_path + "/" + r_file_path
        nli_labels[int(r_num)] = [
            json.loads(l)["label"].lower()
            for l in open(f"{r_file_path}/test.jsonl").read().splitlines()
        ]
    return nli_labels


def read_hate_speech_round_labels(root_path):
    """
    Load the files from the Hate Speech directory and label them automatically
    :param root_path: We assume hate_speech_v0.1 test set present in api folder
    :return: Dict object
    """

    full_path = os.path.join(root_path, "data", "hate_speech_v0.1")

    if not check_data_path_exists(full_path):
        return {}

    r_file_paths = [
        name
        for name in os.listdir(full_path)
        if os.path.isdir(os.path.join(full_path, name))
    ]
    hs_labels = {}
    for r_file_path in r_file_paths:
        r_num = r_file_path[len(r_file_path) - 1 : len(r_file_path)]
        r_file_path = full_path + "/" + r_file_path
        loaded_data = [
            json.loads(l) for l in open(f"{r_file_path}/test.jsonl").read().splitlines()
        ]
        hs_labels[int(r_num)] = [
            {
                "id": example["id"],
                "answer": example["answer"],
                "tags": example["tags"] if "tags" in example else "",
            }
            for example in loaded_data
        ]
    return hs_labels


def read_sentiment_round_labels(root_path):
    """
    Load the files from the Sentiment directory and label them automatically
    :param root_path: We assume sentiment_v1.1 test sets from
        https://github.com/cgpotts/dynasent in individual round folders
        are present in api folder.
    :return: Dict object
    """

    full_path = os.path.join(root_path, "data", "sentiment_v1.1")

    if not check_data_path_exists(full_path):
        return {}

    r_file_paths = [
        name
        for name in os.listdir(full_path)
        if os.path.isdir(os.path.join(full_path, name))
    ]
    sent_labels = {}
    for r_file_path in r_file_paths:
        r_num = r_file_path[len(r_file_path) - 1 : len(r_file_path)]
        r_file_path = full_path + "/" + r_file_path
        loaded_data = [
            json.loads(l) for l in open(f"{r_file_path}/test.jsonl").read().splitlines()
        ]
        sent_labels[int(r_num)] = [
            {
                "id": example["text_id"],
                "answer": example["gold_label"],
                "tags": example["tags"] if "tags" in example else "",
            }
            for example in loaded_data
        ]
    return sent_labels


def read_qa_round_labels(root_path):
    """
    Load the files from QA directory and label them automatically
    :param root_path: We assume aqa_v1.0 test set present in api folder
    :return: Dict object
    """

    full_path = os.path.join(root_path, "data", "aqa_v1.0")

    if not check_data_path_exists(full_path):
        return {}

    r_file_paths = [
        name
        for name in os.listdir(full_path)
        if os.path.isdir(os.path.join(full_path, name))
    ]
    qa_labels = {}
    for r_file_path in r_file_paths:
        r_num = r_file_path[len(r_file_path) - 1 : len(r_file_path)]
        r_file_path = full_path + "/" + r_file_path
        loaded_data = [
            json.loads(l) for l in open(f"{r_file_path}/test.jsonl").read().splitlines()
        ]
        qa_labels[int(r_num)] = [
            {
                "id": example["id"],
                "answer": example["answers"][0]["text"],
                "tags": example["tags"] if "tags" in example else "",
            }
            for example in loaded_data
        ]
    return qa_labels


def get_accuracy(prediction, target):
    """
    Calculate accuracy compared with target label and prediction label
    :param prediction: model predicted label
    :param target: correctly labeled set
    :return: int accuracy value
    """

    return sum(
        1 if prediction[index] == target[index] else 0 for index in range(len(target))
    ) / len(target)


def get_f1(prediction, target):
    """
    Calculate word-overlap f1 score between target label and prediction label
    :param prediction: (list of) model predicted label
    :param target: (list of) correctly labeled set
    :return: int sum of f1 values
    """

    return sum(
        compute_f1(target[index], prediction[index]) for index in range(len(target))
    ) / len(target)


def validate_prediction(r_objects, prediction, task_shortname="nli"):
    """
    Function help as calculated the accuracy and convert them into scores object
    :param r_objects: Rounds object
    :param prediction: Prediction result
    :return: Score objects, ui response object and overall accuracy
    """

    app = bottle.default_app()
    target_tags = None

    # TODO: Make this consistent across tasks
    if task_shortname == "nli":
        # for NLI, we use the ordered list of labels and accuracy
        target_labels = app.config["nli_labels"]
        eval_fn = get_accuracy
    elif task_shortname == "hate speech":
        # for HS, we use {id: label} and accuracy
        target_examples = app.config["hate_speech_labels"]
        eval_fn = get_accuracy
    elif task_shortname == "sentiment":
        target_examples = app.config["sentiment_labels"]
        eval_fn = get_accuracy
    elif task_shortname == "qa":
        # for QA, we use {id: answer} and F1
        target_examples = app.config["qa_labels"]
        eval_fn = get_f1
    else:
        raise AssertionError("Unrecognized task")

    if task_shortname in ["qa", "hate speech", "sentiment"]:

        target_ids = {
            r_id: [x["id"] for x in target_examples[r_id]] for r_id in target_examples
        }
        target_labels = {
            r_id: [x["answer"] for x in target_examples[r_id]]
            for r_id in target_examples
        }
        target_tags = {
            r_id: [x["tags"] for x in target_examples[r_id]] for r_id in target_examples
        }
        # For QA, we are using SQuAD JSON format, so align the predictions with
        # the target labels
        aligned_prediction = []
        for r_id in sorted(target_examples):
            for id in target_ids[r_id]:
                if id in prediction:
                    aligned_prediction.append(prediction[id])
        prediction = aligned_prediction

    # validate prediction and target labels length
    if len(r_objects) > 1 and len(prediction) != len(sum(target_labels.values(), [])):
        raise AssertionError("Prediction and target file length mismatch")
    elif len(r_objects) == 1 and len(target_labels[r_objects[0].rid]) != len(
        prediction
    ):
        raise AssertionError("Prediction and target file length mismatch")

    overall_accuracy = 0
    score_obj_list = []
    rounds_accuracy_list = []
    start_index = 0
    end_index = 0

    for r_obj in sorted(r_objects, key=lambda x: x.rid):
        score_obj = {}
        round_accuracy = {}
        score_obj["round_id"] = r_obj.id
        score_obj["desc"] = None
        score_obj["longdesc"] = None
        score_obj["metadata_json"] = {}

        # Slice and extract round specific prediction
        end_index = end_index + len(target_labels[r_obj.rid])
        score_obj["start_index"] = start_index
        score_obj["end_index"] = end_index
        r_prediction = prediction[start_index:end_index]
        start_index = end_index

        # Get round performance
        r_accuracy = eval_fn(r_prediction, target_labels[r_obj.rid])
        score_obj["pretty_perf"] = str(round(r_accuracy * 100, 2)) + " %"
        score_obj["perf"] = round(r_accuracy * 100, 2)

        # Get performance breakdown for this round across tags
        if target_tags:
            examples_by_tag = {}
            for r_pred, r_target_label, r_target_tags in zip(
                r_prediction, target_labels[r_obj.rid], target_tags[r_obj.rid]
            ):
                for tag in r_target_tags:
                    examples_by_tag.setdefault(tag, []).append((r_pred, r_target_label))
            perf_by_tag = {
                k: eval_fn(*list(zip(*examples)))
                for k, examples in examples_by_tag.items()
            }
            score_obj["metadata_json"]["perf_by_tag"] = [
                {
                    "tag": tag,
                    "pretty_perf": str(round(perf * 100, 2)) + " %",
                    "perf": round(perf * 100, 2),
                }
                for tag, perf in perf_by_tag.items()
            ]

        # Sum rounds accuracy and generate score object list
        overall_accuracy = overall_accuracy + round(r_accuracy * 100, 2)
        round_accuracy["round_id"] = r_obj.rid
        round_accuracy["accuracy"] = round(r_accuracy * 100, 2)
        rounds_accuracy_list.append(round_accuracy)
        score_obj_list.append(score_obj)

    if len(rounds_accuracy_list) > 0:
        overall_accuracy /= len(rounds_accuracy_list)

    return rounds_accuracy_list, score_obj_list, round(overall_accuracy, 2)


def is_current_user(uid, credentials=None):
    """
    Validate the user id is currently logged in one.
    :param uid: User id
    :param credentials: Authorization detail
    :return: Boolean
    """
    try:
        if not credentials:
            token = _auth.jwt_token_from_header()
            credentials = _auth.get_payload(token)
        from models.user import UserModel

        u = UserModel()
        user = u.get(uid)
        if not user:
            return False
        if uid != credentials["id"]:
            return False
        return True
    except Exception as ex:
        logger.exception(
            f"Current user verification failed for ({uid}) exception: {ex}"
        )
        return False


def get_limit_and_offset_from_request():
    """
    Extract the limit and offset value from request
    which is help to design the pagination
    :return: limit, offset
    """

    try:
        limit = bottle.request.query.get("limit")
        offset = bottle.request.query.get("offset")
        if not limit:
            limit = 5
        if not offset:
            offset = 0
        # handle if limit in string like ss
        limit = int(limit)
        offset = int(offset)
    except Exception as ex:
        logger.exception("Query param parsing issue: (%s)" % (ex))
        limit = 5
        offset = 0

    return limit, offset


def parse_url(url):
    """
    parse and extract the host name and server scheme from request url
    :param url:
    :return: url hostname {https://dynabench.org}
    """

    try:
        host_name = bottle.request.get_header("origin")
        if not host_name:
            parsed_uri = urlparse(url)
            formed_url = "{uri.scheme}://{uri.netloc}".format(uri=parsed_uri)
            return formed_url
        return host_name
    except Exception:
        return "https://dynabench.org"


def get_query_count(query):
    """
    Function used to fetch total select in query count
    which is relatively faster than the  sub-query and query.count() build function
    :param query:  query which is created to execute at run time
    :return count: return scalar total count value
    """

    disable_group_by = False
    entity = query._entities[0]
    if hasattr(entity, "column"):
        # _ColumnEntity has column attr - on case: query(Model.column)...
        col = entity.column
        if query._group_by and query._distinct:
            # which query can have both?
            raise NotImplementedError
        if query._group_by or query._distinct:
            col = db.distinct(col)
        if query._group_by:
            # need to disable group_by and enable distinct - we can do this
            # because we have only 1 entity
            disable_group_by = True
        count_func = db.func.count(col)
    else:
        # _MapperEntity doesn't have column attr - on case: query(Model)...
        count_func = db.func.count()
    if query._group_by and not disable_group_by:
        count_func = count_func.over(None)
    count_q = (
        query.options(lazyload("*"))
        .statement.with_only_columns([count_func])
        .order_by(None)
    )
    if disable_group_by:
        count_q = count_q.group_by(None)
    return query.session.execute(count_q).scalar()


def is_fields_blank(data, fields):
    for f in fields:
        if data[f] in (None, ""):
            return True
    return False


def read_file_content(file_obj, max_limit):
    """
    Function to read the file block by block and validate the file size not exceed 5 MB
    :input - file_object
    :return - byte str
    """

    # static buffer size to read content from file object
    BUF_SIZE = 1 * 1024 * 1024

    data_blocks = []
    byte_count = 0

    buf = file_obj.read(BUF_SIZE)
    while buf:
        byte_count += len(buf)
        # Check file size
        if byte_count > max_limit:
            raise AssertionError(f"Request entity too large (max: {max_limit} bytes)")

        data_blocks.append(buf)
        buf = file_obj.read(BUF_SIZE)

    return b"".join(data_blocks)
