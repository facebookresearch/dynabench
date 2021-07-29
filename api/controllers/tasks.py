# Copyright (c) Facebook, Inc. and its affiliates.

import json
from urllib.parse import parse_qs

import bottle
import uuid

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.dataset import Dataset
from models.example import ExampleModel
from models.leaderboard_configuration import LeaderboardConfigurationModel
from models.leaderboard_snapshot import LeaderboardSnapshotModel
from models.model import Model
from models.round import RoundModel
from models.round_user_example_info import RoundUserExampleInfoModel
from models.score import ScoreModel
from models.task import TaskModel
from models.user import UserModel
from models.validation import Validation, ValidationModel


@bottle.get("/tasks")
def tasks():
    t = TaskModel()
    tasks = t.listWithRounds()
    return util.json_encode(tasks)


@bottle.get("/tasks/submitable")
def get_submitable_tasks():
    t = TaskModel()
    tasks = t.listSubmitable()
    return util.json_encode(tasks)


@bottle.get("/tasks/<task_id_or_code>")
def get_task(task_id_or_code):
    t = TaskModel()
    task = t.getWithRoundAndMetricMetadata(task_id_or_code)

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
    info = RoundUserExampleInfoModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = info.getUserLeaderByTid(
            tid=tid, n=limit, offset=offset
        )
        return construct_user_board_response_json(
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
    info = RoundUserExampleInfoModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = info.getUserLeaderByTidAndRid(
            tid=tid, rid=rid, n=limit, offset=offset
        )
        return construct_user_board_response_json(
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
    task = tm.getWithRoundAndMetricMetadata(tid)
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


def construct_user_board_response_json(query_result, total_count=0):
    list_objs = []
    # converting query result into json object
    for result in query_result:
        obj = {}
        obj["uid"] = result[0]
        obj["username"] = result[1]
        obj["avatar_url"] = result[2] if result[2] is not None else ""
        obj["count"] = int(result[3])
        obj["MER"] = str(round(result[4] * 100, 2))
        obj["total"] = str(result[3]) + "/" + str(result[5])
        list_objs.append(obj)
    if list_objs:
        # total_count = query_result[0][len(query_result[0]) - 1]
        resp_obj = {"count": total_count, "data": list_objs}
        return util.json_encode(resp_obj)
    else:
        resp_obj = {"count": 0, "data": []}
        return util.json_encode(resp_obj)


@bottle.get("/tasks/<tid:int>/models/topleaderboardtags")
def get_top_leaderboard_tags(tid):
    offset = 0
    limit = 5
    specific_tag = None
    query_dict = parse_qs(bottle.request.query_string)
    if "offset" in query_dict:
        offset = int(query_dict["offset"][0])
    if "limit" in query_dict:
        limit = int(query_dict["limit"][0])
    if "specific_tag" in query_dict:
        specific_tag = query_dict["specific_tag"][0]
    sm = ScoreModel()
    return sm.getLeaderboardTopPerformingTags(tid, limit, offset, specific_tag)


@bottle.get("/tasks/<tid:int>/models/dynaboard")
def get_dynaboard_info(tid):

    # defaults
    sort_by = "dynascore"
    sort_direction = "asc"
    offset = 0
    limit = 5

    query_dict = parse_qs(bottle.request.query_string)
    if "sort_by" in query_dict:
        sort_by = query_dict["sort_by"][0]
    if "sort_direction" in query_dict:
        sort_direction = query_dict["sort_direction"][0]

    if sort_direction != "asc" and sort_direction != "desc":
        bottle.abort(400, "unrecognized sort direction")

    if "offset" in query_dict:
        offset = int(query_dict["offset"][0])
    if "limit" in query_dict:
        limit = int(query_dict["limit"][0])

    if "ordered_metric_weights" in query_dict:
        ordered_metric_weights = [
            float(weight)
            for weight in query_dict["ordered_metric_weights"][0].split("|")
        ]
    else:
        bottle.abort(400, "missing metric weight data")

    if "ordered_scoring_dataset_weights" in query_dict:
        ordered_dataset_weights = [
            float(weight)
            for weight in query_dict["ordered_scoring_dataset_weights"][0].split("|")
        ]
    else:
        bottle.abort(400, "missing dataset weight data")

    return get_dynaboard_info_for_params(
        tid,
        ordered_metric_weights,
        ordered_dataset_weights,
        sort_by,
        sort_direction,
        limit,
        offset,
    )


def get_dynaboard_info_for_params(
    tid,
    ordered_metric_weights,
    ordered_dataset_weights,
    sort_by,
    sort_direction,
    limit,
    offset,
):
    if sort_direction == "asc":
        reverse_sort = False
    elif sort_direction == "desc":
        reverse_sort = True

    tm = TaskModel()
    t_dict = tm.getWithRoundAndMetricMetadata(tid)
    ordered_metrics = t_dict["ordered_metrics"]
    perf_metric_field_name = t_dict["perf_metric_field_name"]

    ordered_metric_and_weight = [
        dict({"weight": weight}, **metric)
        for weight, metric in zip(ordered_metric_weights, ordered_metrics)
    ]
    ordered_did_and_weight = [
        {"weight": weight, "did": did}
        for weight, did in zip(
            ordered_dataset_weights,
            [dataset["id"] for dataset in t_dict["ordered_scoring_datasets"]],
        )
    ]

    sm = ScoreModel()
    return sm.getDynaboardByTask(
        tid,
        perf_metric_field_name,
        ordered_metric_and_weight,
        ordered_did_and_weight,
        sort_by,
        reverse_sort,
        limit,
        offset,
    )


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
    try:
        sm = ScoreModel()
        tm = TaskModel()
        task_dict = tm.getWithRoundAndMetricMetadata(tid)
        ordered_metric_and_weight = list(
            map(
                lambda metric: dict({"weight": metric["default_weight"]}, **metric),
                task_dict["ordered_metrics"],
            )
        )
        ordered_did_and_weight = list(
            map(
                lambda dataset: dict(
                    {"weight": dataset["default_weight"], "did": dataset["id"]},
                    **dataset,
                ),
                task_dict["ordered_scoring_datasets"],
            )
        )
        dynaboard_response = sm.getDynaboardByTask(
            tid,
            task_dict["perf_metric_field_name"],
            ordered_metric_and_weight,
            ordered_did_and_weight,
            "dynascore",
            True,
            10,
            0,
        )
        mid_and_rid_to_perf = {}
        did_to_rid = {}
        for dataset in sm.dbs.query(Dataset):
            did_to_rid[dataset.id] = dataset.rid
        rid_to_did_to_weight = {}
        for did_and_weight in ordered_did_and_weight:
            rid = did_to_rid[did_and_weight["did"]]
            if rid in rid_to_did_to_weight:
                rid_to_did_to_weight[rid][did_and_weight["did"]] = did_and_weight[
                    "weight"
                ]
            else:
                rid_to_did_to_weight[rid] = {
                    did_and_weight["did"]: did_and_weight["weight"]
                }
        mid_to_name = {}
        for model in sm.dbs.query(Model):
            mid_to_name[model.id] = model.name

        for model_results in json.loads(dynaboard_response)["data"]:
            for dataset_results in model_results["datasets"]:
                rid = did_to_rid[dataset_results["id"]]
                if rid != 0:
                    ordered_metric_field_names = list(
                        map(
                            lambda metric: metric["field_name"],
                            task_dict["ordered_metrics"],
                        )
                    )
                    perf = dataset_results["scores"][
                        ordered_metric_field_names.index(
                            task_dict["perf_metric_field_name"]
                        )
                    ]
                    mid_and_rid = (model_results["model_id"], rid)
                    # Weighting is needed in case there are multiple scoring
                    # datasets for the same round.
                    weighted_perf = (
                        perf
                        * rid_to_did_to_weight[rid][dataset_results["id"]]
                        / sum(rid_to_did_to_weight[rid].values())
                    )
                    if mid_and_rid in mid_and_rid_to_perf:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] += weighted_perf
                    else:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] = weighted_perf
        query_result = []
        for (mid, rid), perf in mid_and_rid_to_perf.items():
            query_result.append((mid, mid_to_name[mid], perf, rid))

        return construct_trends_response_json(query_result=query_result)
    except Exception as ex:
        logger.exception("User trends data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/leaderboard_configuration/<name>")
def get_leaderboard_configuration(tid, name):
    lcm = LeaderboardConfigurationModel()
    leaderboard_configuration = lcm.getByTaskIdAndLeaderboardName(tid, name)

    if not leaderboard_configuration:
        bottle.abort(404, "Not found")

    leaderboard_configuration = leaderboard_configuration.to_dict()
    return util.json_encode(leaderboard_configuration)


@bottle.put("/tasks/<tid:int>/leaderboard_configuration")
@_auth.requires_auth
def create_leaderboard_configuration(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(data, ["name", "configuration_json"]):
        bottle.abort(400, "Missing data")

    lcm = LeaderboardConfigurationModel()

    name = data["name"]
    if lcm.exists(tid=tid, name=name):
        bottle.abort(409, "A fork with the same name already exists for this task.")

    leaderboard_configuration = lcm.create(
        tid, name, credentials["id"], data["configuration_json"]
    )
    return util.json_encode(leaderboard_configuration)


@bottle.get("/tasks/<tid:int>/leaderboard_snapshot/<name>")
def get_leaderboard_configuration(tid, name):

    lsm = LeaderboardSnapshotModel()
    leaderboard_snapshot = lsm.getByTaskIdAndLeaderboardName(tid, name)

    if not leaderboard_snapshot:
        bottle.abort(404, "Not found")

    leaderboard_snapshot = leaderboard_snapshot.to_dict()
    return util.json_encode(leaderboard_snapshot)


@bottle.put("/tasks/<tid:int>/leaderboard_snapshot")
@_auth.requires_auth
def create_leaderboard_configuration(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(
        data,
        [
            "sort",
            "metricWeights",
            "datasetWeights",
            "orderedMetricWeights",
            "orderedDatasetWeights",
            "totalCount",
        ],
    ):
        bottle.abort(400, "Missing data")

    lsm = LeaderboardSnapshotModel()
    name = data["name"] or uuid.uuid4()

    if lsm.exists(tid=tid, name=name):
        bottle.abort(409, "A snapshot with the same name already exists for this task.")

    dynaboard_info = get_dynaboard_info_for_params(
        tid,
        data["orderedMetricWeights"],
        data["orderedDatasetWeights"],
        data["sort"]["field"],
        data["sort"]["direction"],
        data["totalCount"],
        0,
    )
    dynaboard_info = json.loads(dynaboard_info)
    dynaboard_info["metricWeights"] = data["metricWeights"]
    dynaboard_info["datasetWeights"] = data["datasetWeights"]
    dynaboard_info["miscInfoJson"] = dict()
    dynaboard_info["miscInfoJson"]["sort"] = data["sort"]

    dynaboard_info = util.json_encode(dynaboard_info)

    leaderboard_snapshot = lsm.create(tid, name, credentials["id"], dynaboard_info)

    return util.json_encode(leaderboard_snapshot.to_dict())


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
        return util.json_encode(
            sorted(list(response_obj.values()), key=lambda value: value["round"])
        )
    else:
        return util.json_encode([])
