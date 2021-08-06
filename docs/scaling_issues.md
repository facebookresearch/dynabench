# Scaling issues

In the context of Flores I see two different bottlenecks that can arise:

* not enough GPUs to run inference
* not enough eval servers to compute BLEU score

## GPU Inference

As specified in the [evaluation's task_config.py](https://github.com/facebookresearch/dynabench/blob/86c7040e45ed532991f105bd9dde85a50c79f84f/evaluation/metrics/task_config.py#L59-L59)
we use 14 GPUs for running inference on the full track.
Each full track model requires 3 runs for dev/devtest/test splits.
We currently have 64 GPUs of quotas from AWS in us-west-2.
Each inference run takes around 30 hours.
The GPU usage isn't maxed out because of sentence piece, 
lack of optimization of the handler,
and the sagemaker API which is a bit un-flexible and parallelize at the file level
meaning that you'll always have GPUs finishing their work before
the other GPUs of the same job.

Small track inference takes one GPU and around 1 hour, so they aren't really an issue.
We can currently evaluate only about one full track model per day
and have at least 3 full track submissions to eval.
This may cause issue during the final days if we end up with more full track submission.

### Possible mitigations

* Request more GPUs from AWS.
  You can do this from AWS UI.
  We already did this in the past and there was not , we can also get help from ??? (ask Paco) that can direcly call AWS support

* Stop submissions from people going around the limitation
(notably t1 model), but that's not failproof. (from AWS UI)

* Disable evaluation on the dev set (ask Tristan)
we can still re-enable it after the deadline.
In the long term we might want to think about the cost of Flores full track.


## Eval server

* Computing BLEU score on the Flores full track takes 6 hours on 1 CPU.
* The `flores_eval_server` is using two process pools of 8 processes, 
  one for the full track, one for the small tracks.
  So we can evaluate 10 large track submission per day with one server.
  This shouldn't be a blocker. 
* The BLEU score is commputed incrementally per language source, 
  so restarting the eval server doesn't lose more than 5-10 minutes of work.

### Spin up a new server

* If it ever become a bottleneck, we will need to spin up a new eval server
* Ask Douwe to spin a new EC2 instance for a new eval server
* Ask them to install Python3.7 and pip
* You will need to clone and install both dynalab/dynabench
* You will need to copy the config from the Flores eval server:
    ./evaluation/metrics/task_config.py
    ./evaluation/eval_config.py
    ./api/common/config.py
  The simplest to do that is to use `scp` from the "bastion" server:
  `scp flores:dynabench/api/common/config.py flores2:dynabench/api/common/config.py`
* Then start `flores_eval_server.py` inside a screen session

The main issue with this solution is that the original infra
was assuming one eval server.
I modified so that we can have two eval servers, splitting on the different tasks
but there is no balancing implemented, so there is no guarantee that one of the
two servers will take more jobs they can handle.

Also note that it is not strictly necessary to start a new `flores_eval_server.py`
on the new EC2 instance, because the `script/eval_model.py` can compute the BLEU
score for target model.
This would allow to do some manual "load balancing".
See [How to help users](./how_to_help_users.md#resend-the-job-for-evaluation)
