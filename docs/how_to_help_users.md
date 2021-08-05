# How to help users

Dynabench users don't have access to a lot of information
and it's hard for them to debug what's wrong with their model.

Dynalab provide some unit tests, and docker tests.
Make sure the users have run those before submitting their models.
`dynalab test --local` and `dynalab test`

The Flores handler also contains extra tests that can be run with:
`python handler.py`

Then you should do the following steps.

## Find the model name/id

The `evaluation/scripts` folder contains a few helper scripts.
You need to `cd` there before running the scripts.

Generally the users will share with you the id of their model,
or its "shortname".
Each model also get a unique name used in AWS job names and S3 paths.

You can run either:
`python eval_model.py --task FLORES-SMALL2` to list all Flores models with their name, id and endpoint name.
`python eval_model.py --mid 123` to show the same info about a particular model.

## Find the job logs in AWS

You can connect to AWS using FB SSO: https://www.internalfb.com/intern/aws/
Then from the AWS list of services chose "Sagemaker".
Then from the left bar, chose Inference > Batch transform jobs
Make sure you're in the correct region (upper right side).
Dynabench tasks use "N. California" (us-west-1)
while Flores uses "Oregon" (us-west-2).

You should then see all the recent jobs.
You can use the search bar with the job name to find the relevant job.

Job names look like: `ts1627979249-t1-flores101-small1-test-1627982902`
which can be deconstructed as:
`<endpoint_name>-<model_name>-<dataset_name>-<timestamp>`
The `<endpoint_name>-<model_name>-<dataset_name>` part has a maximum length
allowed and can be truncated.

!!! The naming scheme is about to change !!!
https://github.com/facebookresearch/dynabench/issues/633


To see the logs, first click on the job, then go to the tab "Monitor",
then you can access the job logs.
The job logs come in two parts "data logs" and regular logs.
"data logs" are on the Sagemaker side, normally there is nothing interesting there.
The other ones are the logs from the user model.
Normally if they have used the recommanded handler,
you have logs for each batch.
Python traceback will also appear here.

Tips: tick "view as text" checkbox and filter by "MODEL_LOG" to remove torchserve logs.

If the jobs are all green, that means that the model successfully ran.
If the user still can't see their results, it means something is wrong with
the `computer` and that either the metrics failed to compute, or failed to be written.
[See below](#resend-the-job-for-evaluation)


## Find the job ouput files

From the AWS list of services chose "S3".
We have four main buckets:

- evaluation-xxx contains the datasets, and the inference results
- sagemaker-xxx/torchserve/models/ contains the model uploaded by the users
- xxx-us-west-1 contains data for all tasks
- xxx-us-west-2 contains Flores related data


## Resend the job for evaluation

If the models job are green, but the results are not visible that means that
something has gone wrong with the evaluation.
You can use the script `eval_model.py` to re-evaluate a model.
`python eval_model.py eval --mid  MID` will re-compute the metrics.
You can also use `python eval_model.py eval --mid  MID --inference` that will
redo the full inference.
This can be useful for testing changes to the evaluation server,
or if the model jobs failed because of an error on AWS side.
But this assumes you have a running evaluation server.

`python eval_model.py eval --mid  MID` works in autonomy and doesn't require
an additional server.


## How to check the logs of the eval server

Connect to the AWS eval server
you'll need proper credentials and to first ssh into the bastion.
The eval server typically runs inside the `eval` screen session.
You can connect to it if you need to interact with it, 
but to browse the log you can simply look at the log file:
`dynabench/logs/dynabench-server-evaluation.log`.
(The log file is a bit more verbose though, so screen can be nice).

The main events logged are:
* datasets checking on server start
* message received from SQS queue. This correspond to a new model uploaded by user
* Scheduler status, that corresponds to the monitoring
  of ongoing "batch transform" inference jobs, running on Sagemaker
* Computer status, that correspond to the final stage of computing the metrics.
  The flores server also reports how many processes are running for its two pools
  since the Flores full track takes a very long time to run, it can become a bottleneck.
* Files downloaded from S3.
  Small tasks evaluation requires one download, large task requires 101 downloads.
  The file are downloaded in alpahabetical order, so that gives you an idea of the ongoing progress.


## How to restart the eval server

`screen -r eval` then ctrl+c, then `python eval_server.py` or `python flores_eval_server.py` depending on the use case.
Note that in the case of Flores this will interrupt the bleu computation 
for the large task.
