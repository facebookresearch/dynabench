# How to help users

Dynabench users don't have access to a lot of information
and it's hard for them to debug what's wrong with their model.

Make sure that the users have read Dynalab instructions from the 
[Flores repo](https://github.com/facebookresearch/flores/tree/master/dynalab)
Dynalab provide some unit tests, and docker tests.
Make sure the users have run those before submitting their models.
`dynalab test --local` and `dynalab test`

The handler from Flores repo also contains extra tests that can be run with:
`python handler.py`

Then you should do the following steps.

## Find the model name/id

The `evaluation/scripts` folder contains a few helper scripts.
You need to access the SQL db to run those,
so you need to ssh into one of the eval server to run them
(unless you're doing local devlopment).
Also you need to `cd evaluation/scripts` before running the scripts.

Generally the users will share with you the id of their model,
or its "shortname".
Each model also get an endpoint name used in AWS job names and S3 paths.
It looks like `ts1628233220-beam2bsz80large`.

You can run either:
`python eval_model.py ls --task FLORES-SMALL2` 
to list all Flores models with their name, id and endpoint name.
`python eval_model.py ls --mid 123` to show the same info about a particular model.

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

To see the logs, first click on the job, then go to the tab "Monitoring",
then you can access the job logs.
The job logs come in two parts "data logs" and regular logs.
"data logs" are on the Sagemaker side, normally there is nothing interesting there.
The other ones are the logs from the user model.
Normally if they have used the recommanded handler,
you have logs for each batch.
Python traceback will also appear here.

Tips: tick "view as text" checkbox and filter by "MODEL_LOG" to remove torchserve logs.

There are different kind of errors to look for:
* client code error, normally those are detected by the unit tests,
  but some can go through notably we don't test that the models handle all the different languages.
* out of memory error: here the recommendation to the user is to decrease the batch size.
* latency error: if the model takes too long to answer to the batch, torchserve will interrupt it. Here the recommandation is to increase the batch size.

Note that the latency requirement is chosen here in builder's
[task_config.py](https://github.com/facebookresearch/dynabench/blob/master/builder/utils/task_config.py#L22-L22)
The batch size corresponding to this latency is chosen by Sagemaker 
and is 1Mb of json, ie about 1800 sentences.
The handler takes care of splitting that in smaller batches.

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

This can be helpful to ensure that the job did output data in the correct format.
It shouldn't be an issue if they used the correct handler.
Also I never observed any inconsistency on the AWS side. 
Green jobs have all their corresponding data in S3.


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

Following [too-long-names issue](https://github.com/facebookresearch/dynabench/issues/633)
there a several models that only got evaluated on a portion of the datasets
(generally dev and test).
I already re-evaluated some of them on the devtest,
but there might be some more to do.


## Browse the logs

The logs can be found in dynabench `logs` folder,
but they are very verbose and it's hard to find the relevant part.
grep is your friend here.
You can search for a job name.


## Restart the evaluation server

If you make change to the evaluation server code, you'll need to restart it.
To do so, use the following steps:
 
1. connect to the first eval server
2. then connect to the screen session running the eval server process `screen -r eval`
3. Then you `ctrl-c` to interrupt the current process.
4. `git pull`
5. `python eval_server.py` or `python flores_eval_server.py` depending on which server you're on.
6. press `ctrl-a` then `:` then type `detach` in the command bar opening at the bottom
   this will bring you back to the regular terminal.

Go to the other evaluation server to restart it too.
You can ask help from Tristan or Zhiyi for this,
but do bring up `flores_eval_server.py` since this is new.
