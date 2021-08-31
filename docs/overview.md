# Platform overview

Dynabench connects users with different needs to each other. Model **builders** build new models for tasks, which are evaluated in the evaluation-as-a-service cloud and displayed on dynamic leaderboards for **consumers** to inform their work or research. The way a given task is configured is determined by the task **owners**. Models can be put _in the loop_, for instance in order to obtain human-adversarial examples from **breakers**. Such examples can be used to get a more accurate sense of a model's in-the-wild performance, to train up new even better models, and to inform new datasets and metrics.

![Dynabench overview](https://dynabench.org/db-overview-fig1.png)

## Codebase

This codebase is organized as follows. Dynabench has multiple web-based frontends written in [React](https://reactjs.org/) (in `frontends/src`, `frontends/mturk-src` and their shared code `frontends/common`) talking to the same API backend (in `api/`). Models can be uploaded via the API through [Dynalab](https://github.com/facebookresearch/dynalab), which lives in its own repository. Dockerized model containers are built in the build server (in `builder`) and evaluated in the evaluation server (in `evaluator`). We also offer scripts for collecting model-in-the-loop data using crowd workers using [Mephisto](https://github.com/facebookresearch/Mephisto) (in `annotators/`).

![Dynabench codebase](https://dynabench.org/db-overview-fig1.png)
