# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime
import decimal
import json
from urllib.parse import urlparse

import bottle
import sqlalchemy as db
from sqlalchemy.orm import lazyload

import common.auth as _auth
from common.logging import logger
from models.example import ExampleModel
from models.round import RoundModel
from models.validation import Validation, ValidationModel


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


def get_round_data_for_export(tid, rid):
    e = ExampleModel()
    examples_with_validation_ids = e.getByTidAndRidWithValidationIds(tid, rid)
    example_and_validations_dicts = []
    rm = RoundModel()
    ro = rm.getByTidAndRid(tid, rid)
    if ro is False:
        return False
    secret = ro.secret
    vm = ValidationModel()
    validations = vm.dbs.query(Validation)
    validation_dict = {}
    for validation in validations:
        validation_dict[validation.id] = validation
    turk_cache = {}
    cache = {}

    def get_anon_uid_with_cache(secret, uid, cache):
        if (secret, uid) not in cache:
            cache[(secret, uid)] = e.get_anon_uid(secret, uid)
        return cache[(secret, uid)]

    for example, validation_ids in examples_with_validation_ids:
        if example.uid or (
            example.metadata_json and json.loads(example.metadata_json)["annotator_id"]
        ):
            example_and_validations_dict = example.to_dict()
            if example.uid:
                example_and_validations_dict["anon_uid"] = get_anon_uid_with_cache(
                    secret, example.uid, cache
                )
            else:
                example_and_validations_dict["anon_uid"] = get_anon_uid_with_cache(
                    secret,
                    json.loads(example.metadata_json)["annotator_id"],
                    turk_cache,
                )
            example_and_validations_dict["validations"] = []
            for validation_id in [
                int(id)
                for id in filter(lambda item: item != "", validation_ids.split(","))
            ]:
                validation = validation_dict[validation_id]
                if validation.uid or (
                    validation.metadata_json
                    and json.loads(validation.metadata_json)["annotator_id"]
                ):
                    if validation.uid:
                        validation_info = [
                            validation.label.name,
                            validation.mode.name,
                            get_anon_uid_with_cache(
                                secret + "-validator", validation.uid, cache
                            ),
                        ]
                    else:
                        validation_info = [
                            validation.label.name,
                            validation.mode.name,
                            get_anon_uid_with_cache(
                                secret + "-validator",
                                json.loads(validation.metadata_json)["annotator_id"],
                                cache,
                            ),
                        ]

                    if validation.metadata_json:
                        validation_info.append(json.loads(validation.metadata_json))

                    example_and_validations_dict["validations"].append(validation_info)
            example_and_validations_dicts.append(example_and_validations_dict)
    return example_and_validations_dicts
