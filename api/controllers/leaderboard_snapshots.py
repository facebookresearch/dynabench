import json

import bottle

import common.auth as _auth
import common.helpers as util
from controllers.tasks import get_dynaboard_info_for_params
from models.leaderboard_snapshot import LeaderboardSnapshotModel


@bottle.get("/leaderboard_snapshot/<sid:int>")
def get_leaderboard_snapshot(sid):

    lsm = LeaderboardSnapshotModel()
    snapshot_with_creator = lsm.getWithCreatorData(sid)

    if not snapshot_with_creator:
        bottle.abort(404, "Not found")

    ls, u = snapshot_with_creator

    return util.json_encode({"snapshot": ls.to_dict(), "creator": u.to_dict()})


@bottle.put("/leaderboard_snapshot")
@_auth.requires_auth
def create_leaderboard_snapshot(credentials):
    data = bottle.request.json
    if not util.check_fields(
        data,
        [
            "tid",
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
    tid = data["tid"]

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
    dynaboard_info["miscInfoJson"] = {"sort": data["sort"]}

    dynaboard_info = util.json_encode(dynaboard_info)

    leaderboard_snapshot = lsm.create(
        tid,
        credentials["id"],
        data_json=dynaboard_info,
        description=data.get("description", None),
    )

    return util.json_encode(leaderboard_snapshot.to_dict())
