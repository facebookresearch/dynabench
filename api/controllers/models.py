# Copyright (c) Facebook, Inc. and its affiliates.

import json
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
from models.model import DeploymentStatusEnum, ModelModel
from models.notification import NotificationModel
from models.round import RoundModel
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
        fields = ["accuracy", "round_id"]
        s_dicts = [dict(zip(fields, d)) for d in scores]
        model["scores"] = s_dicts
        return util.json_encode(model)
    except AssertionError:
        logger.exception("Not authorized to access unpublished model detail")
        bottle.abort(403, "Not authorized to access model detail")
    except Exception as ex:
        logger.exception("Model detail exception : (%s)" % (ex))
        bottle.abort(404, "Not found")


@bottle.post("/models/upload")
@_auth.requires_auth
def do_upload(credentials):
    """
    Upload the result file for the overall task or specific rounds
    and save those results into the models and scores table
    :param credentials:
    :return: Models scores detail
    """
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    round_id = bottle.request.forms.get("type")
    upload = bottle.request.files.get("file")
    task_id = bottle.request.forms.get("taskId")
    task_shortname = str(bottle.request.forms.get("taskShortName")).lower()

    try:
        if task_shortname in ["qa", "hate speech", "sentiment"]:
            raw_upload_data = json.loads(
                upload.file.read().decode("utf-8")
            )  # if QA or HS, use standard SQuAD JSON format
            test_raw_data = raw_upload_data
        else:
            raw_upload_data = upload.file.read().decode("utf-8")
            test_raw_data = raw_upload_data.lower().splitlines()

    except Exception as ex:
        logger.exception(ex)
        bottle.abort(400, "Upload valid model result file")

    r = RoundModel()
    if round_id == "overall":
        rounds = r.getByTid(task_id)
        # Pass only rounds available for submission
        if len(rounds) > 1:
            rounds = rounds[:-1]
    else:
        rounds = [r.getByTidAndRid(task_id, round_id)]
    if not rounds:
        bottle.abort(400, "Model evaluation failed")

    if len(test_raw_data) > 0:
        try:
            (
                rounds_accuracy_list,
                score_obj_list,
                overall_accuracy,
            ) = util.validate_prediction(
                rounds, test_raw_data, task_shortname=task_shortname
            )
            m = ModelModel()
            model = m.create(
                task_id=task_id,
                user_id=user_id,
                name="",
                shortname="",
                longdesc="",
                desc="",
                overall_perf=f"{overall_accuracy:.2f}",
                upload_datetime=db.sql.func.now(),
            )
            s = ScoreModel()
            s.bulk_create(
                model_id=model.id,
                score_objs=score_obj_list,
                raw_upload_data=json.dumps(raw_upload_data),
            )

            user_dict = user.to_dict()

            if user_dict["models_submitted"] == 0:
                bm = BadgeModel()
                nm = NotificationModel()
                bm.addBadge({"uid": user_dict["id"], "name": "MODEL_BUILDER"})
                nm.create(user_dict["id"], "NEW_BADGE_EARNED", "MODEL_BUILDER")

            um = UserModel()
            um.incrementModelSubmitCount(user_dict["id"])

            response = model.to_dict()
            response["user"] = user_dict
            response["scores"] = rounds_accuracy_list

            return util.json_encode(response)
        except AssertionError:
            bottle.abort(400, "Submission file length mismatch")
    #        except Exception as error_message:
    #            logger.exception('Model evaluation failed: %s' % (error_message))
    #            bottle.abort(400, 'Model evaluation failed: %s' % (error_message))
    else:
        bottle.abort(400, "Invalid file submitted")


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

    ts = int(time.time())
    unique_name = f"ts{ts}-{model_name}"
    s3_filename = f"{unique_name}.tar.gz"
    t = TaskModel()
    task_code = t.getWithRound(task_id)["task_code"]
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
        overall_perf="",
        upload_datetime=db.sql.func.now(),
        upload_timestamp=ts,
        deployment_status=DeploymentStatusEnum.uploaded,
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
