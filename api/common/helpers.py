# Copyright (c) Facebook, Inc. and its affiliates.

import datetime
import decimal
import json
import os
from urllib.parse import urlparse

import bottle
import sqlalchemy as db
from sqlalchemy.orm import lazyload

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


def validate_prediction(r_objects, prediction, task_shortname="nli"):
    """
    Function help as calculated the accuracy and convert them into scores object
    :param r_objects: Rounds object
    :param prediction: Prediction result
    :return: Score objects, ui response object and overall accuracy
    """

    app = bottle.default_app()
    datasets = app.config["datasets"]

    overall_accuracy = 0
    score_obj_list = []
    rounds_accuracy_list = []
    for r_obj in sorted(r_objects, key=lambda x: x.rid):
        if task_shortname == "nli":
            output_key = "label"
            if r_obj.rid == 1:
                s3_dataset = datasets["anli-r1-test"]
            elif r_obj.rid == 2:
                s3_dataset = datasets["anli-r2-test"]
            elif r_obj.rid == 3:
                s3_dataset = datasets["anli-r3-test"]
            else:
                raise AssertionError("Unrecognized round for task")
        elif task_shortname == "qa":
            output_key = "answer"
            if r_obj.rid == 1:
                s3_dataset = datasets["aqa-r1-test"]
            else:
                raise AssertionError("Unrecognized round for task")
        elif task_shortname == "hate speech":
            output_key = "label"
            if r_obj.rid == 1:
                s3_dataset = datasets["ahs-r1-test"]
            elif r_obj.rid == 2:
                s3_dataset = datasets["ahs-r2-test"]
            elif r_obj.rid == 3:
                s3_dataset = datasets["ahs-r3-test"]
            else:
                raise AssertionError("Unrecognized round for task")
        elif task_shortname == "sentiment":
            output_key = "label"
            if r_obj.rid == 1:
                s3_dataset = datasets["dynasent-r1-test"]
            elif r_obj.rid == 2:
                s3_dataset = datasets["dynasent-r2-test"]
            else:
                raise AssertionError("Unrecognized round for task")
        else:
            raise AssertionError("Unrecognized task")
        r_target_ids = {item["id"] for item in s3_dataset.read_labels()}
        r_predictions = []
        for key, value in prediction.items():
            if key in r_target_ids:
                r_predictions.append({"id": key, output_key: value})
        score_obj = s3_dataset.eval(r_predictions)

        # Sum rounds accuracy and generate score object list
        overall_accuracy = overall_accuracy + round(score_obj["perf"], 2)
        round_accuracy = {}
        round_accuracy["round_id"] = r_obj.rid
        round_accuracy["accuracy"] = round(score_obj["perf"], 2)
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
