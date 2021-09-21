# Architecture

## Overview

```
┌───────────┐        ┌────────────┐      ┌──────────────┐       ┌──────────────┐
│  User w/  │        │            │      │              │       │              │
│Dynalab CLI├───────►│ Web server ├─────►│ Build server ├──────►│  Sagemaker   │
│           │        │            │      │              │       │    Models    │
└───────────┘        └─────┬──────┘      └──────┬───────┘       └──────────────┘
                           │                    │
                           │             ┌──────▼───────┐       ┌──────────────┐
                           │             │              │       │              │
                           │             │ Eval server  ├──────►│  Sagemaker   │
                           │             │              │       │TransformJobs │
                           │             └──────┬───────┘       └──────────────┘
                           │                    │
                     ┌─────▼────────┐           │
                     │              │           │
                     │ MySQL DB     │◄──────────┘
                     │              │
                     └──────────────┘
```

Users mostly interact with Dynabench
through the [Dynalab](https://github.com/facebookresearch/dynalab) CLI.
Dynalab help users creating, validating and uploading model to dynabench.

The web server is responsible to expose some of the DB information
to users through the website,
as well as through the CLI, for instance it can list available tasks.
It is also the web server that receives models uploaded by user.
It will first upload them to S3 then send a message to the Build server,
so that they take care of this submission.

The build server is responsible for building a docker image
from the model uploaded by the user.
Once it's done, the docker image will be uploaded to AWS Container Registry
and also be registered as a model in Sagemaker.
Finally the build server sends an email to the user,
and also send a message to the Eval server
that the model is ready to be evaluated (also using an SQS queue).

The Eval server is responsible for scheduling the inference of a model on AWS,
and once the output of the model is available, to compute the metrics
for the given task (precision, BLEU score, ...).

## Web server

Once the server receives a model it will upload it to S3,
into `sagemaker-<region>/torchserve/models/<task_code>/` folder,
with the name `ts<submission_id>-<model_name>.tar.gz`.
There are generally two running instances of the web server
on two distinct instances, with a load balancer on top.
The web server communicates with the build server through an SQS queue.
Generally named `xxx-build`.

Relevant code is under [api/](../api), 
The config file is `api/common/config.py`.
This config file is not part of the repo, but only found on the production server.


## Build server

The Build serve receives messages from the web server through an SQS queue.
Torchserve needs model to be packed in a .tar.gz
This archive will be uploaded on S3 next to the user submission,
in `archive.ts<submission_id>-<model_name>.tar.gz`.
The docker image is generic and will contain one torchserve server
that can only run inference for this model uploaded by the user.

Relevant code is under [builder/](../builder), 
The config file is `builder/deploy_config.py`.

Depending on the task the build server will behave a bit differently.
The [task_config.py](../builder/utils/task_config.py) file contains 
the __build__ config for each task.

The config contains the following fields:

* instance_type: Type of AWS instance used for this task.
* create_endpoint: Do we want to have an endpoint to interact with the model afterward ?
* aws_region: The AWS region where to run the evaluation jobs. Different regions have different instance available.
Note that the build server and the evaluation server will all stay in the main 
region `us-west-1`, only the inference will be done in another region.
This also impacts the S3 bucket used, and where the models are uploaded 
* gpu: Whether we need GPU support. This changes the content of the Docker image.
* torchserve_config: torchserve specific config.
* eval_server_id: Name of the eval_server to use for evaluation

The `eval_server_id` is important because we actually have two
eval servers, one for Flores task (flores101), one for all the other tasks (default).
The build server will mark messages with a specific `eval_server_id` and
each eval server will only treat messages with their ids, and ignore others.

Note: this dispatch mechanism is susceptible to be improved after the Flores 
competition.


## Eval server

The Eval serve receives messages from the build server through an SQS queue.
Each message specifies one or several models that should be evaluated against
one or several datasets.
As explained above, each server has an id, and only look at the message that 
are addressed to themselves.
Other messages are ignored, and the message goes back into the SQS queue after 
a short delay (30s).

The relevant code is under [evaluation/](../evaluation).

Evaluating a model against a dataset is done in two parts:
* running the model inference using a "Batch transform job"
* reading the output files from S3 and compute the task metrics (accuracy, ...)

Note that the second part is run locally by the evaluation server and is expected to be relatively quick.
There is a process pool that allows to run several evaluation at once.

The `Scheduler` class is responsible for scheduling the inference job.
Ongoing and past jobs can be monitored on
[AWS website](https://us-west-1.console.aws.amazon.com/sagemaker/home?region=us-west-1#/transform-jobs)
(you'll need to [switch region](https://us-west-2.console.aws.amazon.com/sagemaker/home?region=us-west-2#/transform-jobs) for Flores jobs).

The [dataset classes](../evaluation/datasets) are responsible for reading 
the output files and the labels.
The `Computer` class is responsible for computing the requested metrics for the given task.
The task to metric mapping is specified in [task_config.py](../evaluation/metrics/task_config.py)
