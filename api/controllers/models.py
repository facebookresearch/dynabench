# Copyright (c) Facebook, Inc. and its affiliates.

import json
import secrets
import time

import boto3
import bottle
import sagemaker
import sqlalchemy as db

import common.auth as _auth
import common.helpers as util
from common.config import config
from common.logging import logger
from models.badge import BadgeModel
from models.dataset import AccessTypeEnum, DatasetModel
from models.model import DeploymentStatusEnum, ModelModel
from models.score import ScoreModel
from models.task import TaskModel
from models.user import UserModel


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
            raise AssertionError()
        model["user"] = query_result[1].to_dict()
        # Construct Score information based on model id
        scores = s.getByMid(mid)
        datasets = dm.getByTid(model["tid"])
        did_to_dataset_name = {}
        did_to_dataset_access_type = {}
        for dataset in datasets:
            did_to_dataset_name[dataset.id] = dataset.name
            did_to_dataset_access_type[dataset.id] = dataset.access_type
        fields = ["accuracy", "round_id", "did"]
        s_dicts = [
            dict(
                zip(fields, d),
                **{
                    "dataset_name": did_to_dataset_name.get(d.did, None),
                    "dataset_access_type": did_to_dataset_access_type.get(d.did, None),
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
        return util.json_encode(model)
    except AssertionError:
        logger.exception("Not authorized to access unpublished model detail")
        bottle.abort(403, "Not authorized to access model detail")
    except Exception as ex:
        logger.exception("Model detail exception : (%s)" % (ex))
        bottle.abort(404, "Not found")


@bottle.put("/models/<mid:int>/publish")
@_auth.requires_auth
def publish_model(credentials, mid):
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
            model_card=data["model_card"],
            is_published=True,
        )
        model = m.get(mid)
        um = UserModel()
        user = um.get(model.uid)
        bm = BadgeModel()
        badge_names = bm.handlePublishModel(user, model)
        return {"status": "success", "badges": "|".join(badge_names)}
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
    task_id = bottle.request.forms.get("taskId")
    tarball = bottle.request.files.get("tarball")

    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sagemaker_session = sagemaker.Session(boto_session=session)
    bucket_name = sagemaker_session.default_bucket()

    endpoint_name = f"ts{int(time.time())}-{model_name}"[:63]
    s3_filename = f"{endpoint_name}.tar.gz"
    t = TaskModel()
    task_code = t.get(task_id).task_code
    s3_path = f"torchserve/models/{task_code}/{s3_filename}"

    logger.info(f"Uploading {model_name} to S3 at {s3_path} for user {user_id}")

    try:
        s3_client = session.client("s3")
        response = s3_client.upload_fileobj(tarball.file, bucket_name, s3_path)
        if response:
            logger.info(f"Response from the mar file upload to s3 {response}")
    except Exception as ex:
        logger.exception(ex)
        bottle.abort(400, "upload failed")

    # Update database entry
    m = ModelModel()
    model = m.create(
        task_id=task_id,
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
        MessageBody=json.dumps(
            {"model_id": model.id, "s3_uri": f"s3://{bucket_name}/{s3_path}"}
        )
    )
