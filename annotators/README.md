This is where you launch Mturk tasks from.

# Preliminaries

Install Mephisto in this local directory from the github:

`cd annotators/ && git clone https://github.com/facebookresearch/Mephisto`

# Adding a new task

In order to add a new task, do the following:

1. Add a new directory for your task components, e.g.
   `frontends/mturk-src/components/divyansh/pilot-1`
2. Add a new identifier e.g. `divyansh-pilot-1` to the TaskComponents in
   `frontends/mturk-src/components/core.jsx` and import your task components
3. Build your bundle using `npm run mturk`
3. Specify the desired task_id (`divyansh-pilot-1`) in `run_mturk.py`
4. Run `run_mturk.py` and go to the corresponding URL to see the taks running
