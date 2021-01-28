# Copyright (c) Facebook, Inc. and its affiliates.

import json

import bottle

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.example import ExampleModel
from models.round import RoundModel
from models.score import ScoreModel
from models.task import TaskModel
from models.user import UserModel
from models.validation import Validation, ValidationModel


@bottle.get("/tasks")
def tasks():
    t = TaskModel()
    tasks = t.listWithRounds()
    return util.json_encode(tasks)


@bottle.get("/tasks/<tid:int>")
def get_task(tid):
    t = TaskModel()
    task = t.getWithRound(tid)
    if not task:
        bottle.abort(404, "Not found")
    return util.json_encode(task)


@bottle.get("/tasks/<tid:int>/<rid:int>")
def get_task_round(tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    if not round:
        bottle.abort(404, "Not found")
    return util.json_encode(round.to_dict())


@bottle.get("/tasks/<tid:int>/users")
def get_user_leaderboard(tid):
    """
    Return users and MER based on their examples score based on tasks
    :param tid:
    :return: Json Object
    """
    e = ExampleModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = e.getUserLeaderByTidAndRid(
            tid=tid, n=limit, offset=offset
        )
        return util.construct_user_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("User leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/users")
def get_leaderboard_by_task_and_round(tid, rid):
    """
    Get top leaders based on their examples score for specific task and round
    :param tid: task id
    :param rid: round id
    :return: Json Object
    """
    e = ExampleModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = e.getUserLeaderByTidAndRid(
            tid=tid, rid=rid, n=limit, offset=offset
        )
        return util.construct_user_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("User leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task/round detail")


def get_round_data_for_export(tid, rid):
    e = ExampleModel()
    examples_with_validation_ids = e.getByTidAndRidWithValidationIds(tid, rid)
    example_and_validations_dicts = []
    rm = RoundModel()
    secret = rm.getByTidAndRid(tid, rid).secret
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


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/export")
@_auth.requires_auth
def export_current_round_data(credentials, tid, rid):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        if (tid, "owner") not in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(403, "Access denied")
    return util.json_encode(get_round_data_for_export(tid, rid))


@bottle.get("/tasks/<tid:int>/export")
@_auth.requires_auth
def export_task_data(credentials, tid):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        if (tid, "owner") not in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(403, "Access denied")
    rm = RoundModel()
    example_and_validations_dicts = []
    for rid in [round.rid for round in rm.getByTid(tid)]:
        example_and_validations_dicts += get_round_data_for_export(tid, rid)
    return util.json_encode(example_and_validations_dicts)


@bottle.put("/tasks/<tid:int>/settings")
@_auth.requires_auth
def update_task_settings(credentials, tid):
    data = bottle.request.json

    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        if (tid, "owner") not in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(403, "Access denied")
    tm = TaskModel()
    task = tm.getWithRound(tid)
    if not task:
        bottle.abort(404, "Not found")

    if "settings" not in data:
        bottle.abort(400, "Missing settings data")
    try:
        tm.update(tid, {"settings_json": json.dumps(data["settings"])})

        return util.json_encode({"success": "ok"})
    except Exception:
        logger.error(f"Error updating task settings {tid}: {task}")
        bottle.abort(500, {"error": str(task)})


@bottle.get("/tasks/<tid:int>/models")
def get_model_leaderboard(tid):
    """
    Fetch Top perform models based on their test score
    :param tid: Task Id
    :return: Json Object
    """
    try:
        score = ScoreModel()
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getOverallModelPerfByTask(
            tid=tid, n=limit, offset=offset
        )
        return construct_model_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("Model leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/models")
def get_model_leaderboard_round(tid, rid):
    """
    Fetch  top perform models based on round and task
    :param tid: Task id
    :param rid: Round id
    :return: Json Object
    """
    score = ScoreModel()
    try:
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getModelPerfByTidAndRid(
            tid=tid, rid=rid, n=limit, offset=offset
        )
        return construct_model_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("Model leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task/round detail")


@bottle.get("/tasks/<tid:int>/trends")
def get_task_trends(tid):
    """
    Get top perform models and its round wise performance metrics at task level
    It will fetch only top 10 models and its round wise performance metrics
    :param tid: Task id
    :return: Json Object
    """
    model = ScoreModel()
    try:
        query_result = model.getTrendsByTid(tid=tid)
        return construct_trends_response_json(query_result=query_result)
    except Exception as ex:
        logger.exception("User trends data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


def construct_model_board_response_json(query_result, total_count):
    fields = [
        "model_id",
        "model_name",
        "owner",
        "owner_id",
        "accuracy",
        "metadata_json",
    ]
    list_objs = []
    leaderboard_tags = []
    for d in query_result:
        obj = dict(zip(fields, d))
        if obj.get("metadata_json", None):
            obj["metadata_json"] = json.loads(obj["metadata_json"])
            # Check tags for every model to allow flexibility for adding or
            # removing tags in future
            if "perf_by_tag" in obj["metadata_json"]:
                for tag in obj["metadata_json"]["perf_by_tag"]:
                    if tag["tag"] not in leaderboard_tags:
                        leaderboard_tags.append(tag["tag"])
        else:
            obj["metadata_json"] = {}
        list_objs.append(obj)

    if list_objs:
        resp_obj = {
            "count": total_count,
            "data": list_objs,
            "leaderboard_tags": leaderboard_tags,
        }
        return util.json_encode(resp_obj)
    else:
        resp_obj = {"count": 0, "data": [], "leaderboard_tags": []}
        return util.json_encode(resp_obj)


def construct_trends_response_json(query_result):
    # construct response to support UI render
    response_obj = {}
    for reslt in query_result:
        if reslt[3] in response_obj.keys():
            val = response_obj[reslt[3]]
            val[reslt[1] + "_" + str(reslt[0])] = reslt[2]
            response_obj[reslt[3]] = val
        else:
            response_obj[reslt[3]] = {
                "round": reslt[3],
                reslt[1] + "_" + str(reslt[0]): reslt[2],
            }
    if response_obj:
        return util.json_encode(list(response_obj.values()))
    else:
        return util.json_encode([])
