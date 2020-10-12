This is where you launch Mturk tasks from.

# Preliminaries

Install Mephisto in this local directory from the github:

`cd annotators/ && git clone https://github.com/facebookresearch/Mephisto && pip install -e .`

# Adding a new task

In order to add a new task, do the following:

1. Add a new directory for your task components, e.g.
   `frontends/mturk-src/components/divyansh/pilot-1`
   You will need to define three things here: an `OnboardingComponent` (for onboarding Turkers and rejecting bad ones), a `PreviewComponenent` (shown to Turkers before they accept the HIT) and a `FrontendComponent` (the actual task interface).
2. Add a new identifier e.g. `divyansh-pilot-1` to the TaskComponents in
   `frontends/mturk-src/components/core.jsx` and import your task components accordingly
3. Build your bundle using `npm run mturk` from anywhere in frontends/web.
3. Create a JSON config file e.g. in `conf/nli_r1.yaml`. See examples in that dir - should be straightforward - and make sure the task_name field is the same as your task identifier.
4. Run `run_mturk.py conf=nli_r1`, follow any account setup instructions from Mephisto, and go to the corresponding URL to see the task running.
5. If you want to enable onboarding, add the `onboarding_qualification` argument in the `yaml` file.

If this is a completely new task for the DynaBench backend, you also need to:

1. Make sure that there is a corresponding task and task id in the DynaBench database.
2. Add contexts to the DynaBench database, if applicable.

# Configuring your task

When you add a new task, you need to write a new config file. Most fields should be self-explanatory if you look at other configs. The possible qualifications are:
 * 100_hits_approved: minimum 100 hits approved before a Turker qualifies
 * english_only: Turker needs to be from an English-speaking country
 * .. please add your own if you need anything else!

# Deploying on MTurk

Once you are done developing locally, you can deploy in MTurk sandbox by adding `python run_mturk.py mephisto/architect=heroku mephisto.provider.requester_name=my_mturk_user_sandbox`, 
and for real by using `python run_mturk.py mephisto/architect=heroku mephisto.provider.requester_name=my_mturk_user`.  
For details, please refer to [this link](https://github.com/facebookresearch/mephisto/blob/master/docs/quickstart.md).
