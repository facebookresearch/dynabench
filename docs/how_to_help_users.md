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
The `<endpoint_name>-<model_name>-<dataset_name>` has a maximum length
allowed and can be truncated.

!!! This is about to change !!!

To see the logs, first click on the job, then go to the tab "Monitoring",
then you can access the job logs.
The job logs come in two parts "data logs" and regular logs.
"data logs" are on the Sagemaker side, normally there is nothing interesting there.
The other ones are the logs from the user model.
Normally if they have used the recommanded handler,
you have logs for each batch.
Python traceback will also appear here.

Tips: tick "view as text" checkbox and filter by "MODEL_LOG" to remove torchserve logs.

