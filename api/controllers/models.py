# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets
import sys
import tempfile
import time

import boto3
import bottle
import sqlalchemy as db
import ujson

import common.auth as _auth
import common.helpers as util
from common.config import config
from common.logging import logger
from models.badge import BadgeModel
from models.dataset import AccessTypeEnum, DatasetModel
from models.model import DeploymentStatusEnum, ModelModel
from models.score import ScoreModel
from models.task import AnnotationVerifierMode, TaskModel
from models.user import UserModel

from .tasks import ensure_owner_or_admin


sys.path.append("../evaluation")  # noqa isort:skip
from utils.helpers import get_predictions_s3_path, send_eval_request  # noqa isort:skip


@bottle.post("/models/upload_predictions/<tid:int>/<model_name>")
@_auth.requires_auth
def do_upload_via_predictions(credentials, tid, model_name):
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    tm = TaskModel()
    task = tm.get(tid)
    if not task.has_predictions_upload:
        bottle.abort(
            403,
            """This task does not allow prediction uploads. Submit a model instead.""",
        )

    m = ModelModel()
    if (
        bottle.default_app().config["mode"] == "prod"
        and m.getCountByUidTidAndHrDiff(
            user_id, tid=task.id, hr_diff=task.dynalab_hr_diff
        )
        >= task.dynalab_threshold
    ):
        logger.error("Submission limit reached for user (%s)" % (user_id))
        bottle.abort(429, "Submission limit reached")

    uploads = {}
    dm = DatasetModel()
    datasets = list(dm.getByTid(tid))
    dataset_names = [dataset.name for dataset in datasets]
    for name in dataset_names:
        uploads[name] = bottle.request.files.get(name)

    # Users don't need to upload preds for all datasets.
    uploads = {
        name: uploads[name]
        for name, upload in uploads.items()
        if uploads[name] is not None
    }

    for dataset in datasets:
        if (
            dataset.access_type == AccessTypeEnum.scoring
            and dataset.name not in uploads.keys()
        ):
            bottle.abort(400, "Need to upload predictions for all leaderboard datasets")

    parsed_uploads = {}
    # Ensure correct format
    for name, upload in uploads.items():
        try:
            parsed_upload = [
                ujson.loads(line)
                for line in upload.file.read().decode("utf-8").splitlines()
            ]
            for io in parsed_upload:
                if (
                    not task.verify_annotation(
                        io, mode=AnnotationVerifierMode.predictions_upload
                    )
                    or "uid" not in io
                ):
                    bottle.abort(400, "Invalid prediction file")
            parsed_uploads[name] = parsed_upload

        except Exception as ex:
            logger.exception(ex)
            bottle.abort(400, "Invalid prediction file")

    endpoint_name = f"ts{int(time.time())}-{model_name}"

    status_dict = {}
    # Create local model db object
    model = m.create(
        task_id=tid,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc="",
        desc="",
        upload_datetime=db.sql.func.now(),
        endpoint_name=endpoint_name,
        deployment_status=DeploymentStatusEnum.predictions_upload,
        secret=secrets.token_hex(),
    )
    with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
        for dataset_name, parsed_upload in parsed_uploads.items():
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for datum in parsed_upload:
                    datum["id"] = datum["uid"]  # TODO: right now, dynalab models
                    # Expect an input with "uid" but output "id" in their predictions.
                    # Why do we use two seperate names for the same thing? Can we make
                    # this consistent?
                    del datum["uid"]
                    tmp.write(ujson.dumps(datum) + "\n")
                tmp.close()
                ret = _eval_dataset(dataset_name, endpoint_name, model, task, tmp.name)
                status_dict.update(ret)

    return util.json_encode({"success": "ok", "model_id": model.id})


def _eval_dataset(dataset_name, endpoint_name, model, task, afile):
    try:
        _upload_prediction_file(
            afile=afile,
            task_code=task.task_code,
            s3_bucket=task.s3_bucket,
            endpoint_name=endpoint_name,
            dataset_name=dataset_name,
        )
        eval_config = {
            "aws_access_key_id": config["eval_aws_access_key_id"],
            "aws_secret_access_key": config["eval_aws_secret_access_key"],
            "aws_region": config["eval_aws_region"],
            "evaluation_sqs_queue": config["evaluation_sqs_queue"],
        }
        ret = send_eval_request(
            eval_server_id=task.eval_server_id,
            model_id=model.id,
            dataset_name=dataset_name,
            config=eval_config,
            logger=logger,
        )
    except Exception as e:
        logger.exception(e)
        bottle.abort(400, "Could not upload file: %s" % (e))
    return {dataset_name: {"success": ret}}


def _upload_prediction_file(afile, task_code, s3_bucket, endpoint_name, dataset_name):
    client = boto3.client(
        "s3",
        aws_access_key_id=config["eval_aws_access_key_id"],
        aws_secret_access_key=config["eval_aws_secret_access_key"],
        region_name=config["eval_aws_region"],
    )
    path = get_predictions_s3_path(
        endpoint_name=endpoint_name, task_code=task_code, dataset_name=dataset_name
    )
    response = client.upload_file(afile, s3_bucket, path)
    if response:
        logger.info(response)

    return path


@bottle.get("/models/<mid:int>")
def get_model(mid):
    m = ModelModel()
    model = m.getPublishedModel(mid)
    if not model:
        bottle.abort(404, "Not found")
    # Also get this model's scores?
    return util.json_encode(model.to_dict())


@bottle.get("/models/<mid:int>/details")
@_auth.auth_optional
def get_model_detail(credentials, mid):
    m = ModelModel()
    s = ScoreModel()
    dm = DatasetModel()
    try:
        query_result = m.getModelUserByMid(mid)
        model = query_result[0].to_dict()

        # Secure to read unpublished model detail for only owner
        if (
            not query_result[0].is_published
            and query_result[0].uid != credentials["id"]
        ):
            ensure_owner_or_admin(query_result[0].tid, credentials["id"])

        is_current_user = util.is_current_user(query_result[1].id, credentials)

        if not is_current_user and query_result[0].is_anonymous:
            model["username"] = None
            model["uid"] = None
        else:
            model["username"] = query_result[1].username
        # Construct Score information based on model id
        scores = s.getByMid(mid)
        datasets = dm.getByTid(model["tid"])
        did_to_dataset_name = {}
        did_to_dataset_access_type = {}
        did_to_dataset_longdesc = {}
        did_to_dataset_source_url = {}
        for dataset in datasets:

            did_to_dataset_name[dataset.id] = dataset.name
            did_to_dataset_access_type[dataset.id] = dataset.access_type
            did_to_dataset_longdesc[dataset.id] = dataset.longdesc
            did_to_dataset_source_url[dataset.id] = dataset.source_url
        fields = ["accuracy", "round_id", "did", "metadata_json"]
        s_dicts = [
            dict(
                zip(fields, d),
                **{
                    "dataset_name": did_to_dataset_name.get(d.did, None),
                    "dataset_access_type": did_to_dataset_access_type.get(d.did, None),
                    "dataset_longdesc": did_to_dataset_longdesc.get(d.did, None),
                    "dataset_source_url": did_to_dataset_source_url.get(d.did, None),
                },
            )
            for d in scores
        ]
        model["leaderboard_scores"] = list(
            filter(
                lambda s_dict: s_dict["dataset_access_type"] == AccessTypeEnum.scoring,
                s_dicts,
            )
        )
        model["non_leaderboard_scores"] = list(
            filter(
                lambda s_dict: s_dict["dataset_access_type"] == AccessTypeEnum.standard,
                s_dicts,
            )
        )
        model["deployment_status"] = model["deployment_status"].name
        model["evaluation_status"] = model["evaluation_status"].name
        return util.json_encode(model)
    except AssertionError:
        logger.exception("Not authorized to access unpublished model detail")
        bottle.abort(403, "Not authorized to access model detail")
    except Exception as ex:
        logger.exception("Model detail exception : (%s)" % (ex))
        bottle.abort(404, "Not found")


@bottle.put("/models/<mid:int>/update")
@_auth.requires_auth
def update_model(credentials, mid):
    m = ModelModel()
    data = bottle.request.json
    if not util.check_fields(data, ["name", "description"]):
        bottle.abort(400, "Missing data")

    try:
        model = m.getUnpublishedModelByMid(mid)
        if model.uid != credentials["id"]:
            logger.error(
                "Original user ({}) and the modification tried by ({})".format(
                    model.uid, credentials["id"]
                )
            )
            bottle.abort(401, "Operation not authorized")

        m.update(
            model.id,
            name=data["name"],
            longdesc=data["description"],
            params=data["params"],
            languages=data["languages"],
            license=data["license"],
            source_url=data["source_url"],
            model_card=data["model_card"],
            is_anonymous=data["is_anonymous"],
            is_published=False,
        )
        return {"status": "success"}
    except db.orm.exc.NoResultFound:
        bottle.abort(404, "Model Not found")
    except Exception as e:
        logger.exception("Could not update model details: %s" % (e))
        bottle.abort(400, "Could not update model details: %s" % (e))


@bottle.put("/models/<mid:int>/revertstatus")
@_auth.requires_auth
def revert_model_status(credentials, mid):
    m = ModelModel()
    try:
        model = m.getUnpublishedModelByMid(mid)
        if model.uid != credentials["id"]:
            logger.error(
                "Original user ({}) and the modification tried by ({})".format(
                    model.uid, credentials["id"]
                )
            )
            bottle.abort(401, "Operation not authorized")

        m.update(model.id, is_published=not model.is_published)
        model = m.getUnpublishedModelByMid(mid)
        um = UserModel()
        user = um.get(model.uid)
        bm = BadgeModel()
        if model.is_published:
            badge_names = bm.handlePublishModel(user, model)
            return {"status": "success", "badges": "|".join(badge_names)}
        bm.handleUnpublishModel(user, model)
        return {"status": "success"}
    except db.orm.exc.NoResultFound:
        bottle.abort(404, "Model Not found")
    except Exception as e:
        logger.exception("Could not update model details: %s" % (e))
        bottle.abort(400, "Could not update model details: %s" % (e))


@bottle.post("/models/upload/s3")
@_auth.requires_auth
def upload_to_s3(credentials):
    # Authentication
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    # Upload file to S3
    model_name = bottle.request.forms.get("name")
    task_code = bottle.request.forms.get("taskCode")
    if not task_code:
        bottle.abort(404, "No task requested")
    t = TaskModel()
    task = t.getByTaskCode(task_code)
    if not task:
        bottle.abort(404, "Task not found")
    if not task.submitable:
        bottle.abort(403, "Task not available for model submission")

    m = ModelModel()
    if (
        bottle.default_app().config["mode"] == "prod"
        and m.getCountByUidTidAndHrDiff(
            user_id, tid=task.id, hr_diff=task.dynalab_hr_diff
        )
        >= task.dynalab_threshold
    ):
        logger.error("Submission limit reached for user (%s)" % (user_id))
        bottle.abort(429, "Submission limit reached")

    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    bucket_name = task.s3_bucket
    logger.info(f"Using AWS bucket {bucket_name} for task {task_code}")

    endpoint_name = f"ts{int(time.time())}-{model_name}"[:63]
    s3_filename = f"{endpoint_name}.tar.gz"
    s3_path = f"torchserve/models/{task_code}/{s3_filename}"

    logger.info(f"Uploading {model_name} to S3 at {s3_path} for user {user_id}")

    try:
        s3_client = session.client("s3")
        tarball = bottle.request.files.get("tarball")
        response = s3_client.upload_fileobj(tarball.file, bucket_name, s3_path)
        if response:
            logger.info(f"Response from the mar file upload to s3 {response}")
    except Exception as ex:
        logger.exception(ex)
        bottle.abort(400, "upload failed")

    # Update database entry
    model = m.create(
        task_id=task.id,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc="",
        desc="",
        upload_datetime=db.sql.func.now(),
        endpoint_name=endpoint_name,
        deployment_status=DeploymentStatusEnum.uploaded,
        secret=secrets.token_hex(),
    )

    um = UserModel()
    um.incrementModelSubmitCount(user.to_dict()["id"])

    # send SQS message
    logger.info(f"Send message to sqs - enqueue model {model_name} for deployment")
    sqs = session.resource("sqs")
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    queue.send_message(
        MessageBody=ujson.dumps(
            {"model_id": model.id, "s3_uri": f"s3://{bucket_name}/{s3_path}"}
        )
    )


@bottle.get("/models/<mid:int>/deploy")
@_auth.requires_auth
def deploy_model_from_s3(credentials, mid):
    # Authentication (only authenticated users can redeploy models for interaction)
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    m = ModelModel()
    model = m.getPublishedModel(mid)

    if not model.is_published:
        bottle.abort(403, "Model is not published")

    if not model.deployment_status == DeploymentStatusEnum.takendownnonactive:
        bottle.abort(
            403, "Attempting to deploy a model not taken down due to inactivity"
        )

    model_name = model.name

    t = TaskModel()
    task = t.getBtTaskId(model.tid)
    task_code = task.task_code
    bucket_name = task.s3_bucket

    endpoint_name = model.endpoint_name
    s3_filename = f"{endpoint_name}.tar.gz"
    s3_path = f"torchserve/models/{task_code}/{s3_filename}"

    # Update database entry
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )

    # send SQS message
    logger.info(f"Send message to sqs - enqueue model {model_name} for re-deployment")
    sqs = session.resource("sqs")
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    queue.send_message(
        MessageBody=ujson.dumps(
            {"model_id": model.id, "s3_uri": f"s3://{bucket_name}/{s3_path}"}
        )
    )
