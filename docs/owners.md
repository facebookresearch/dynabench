# Task Owners Manual

If you’re already familiar with the platform, you can probably skip this high-level overview:

Dynabench is organized around _tasks_ (e.g. [NLI](https://dynabench.org/tasks/nli) or [QA](https://dynabench.org/tasks/qa)). Each task can have one or more owners, who have control over how the task is set up. For example, task owners can specify which existing datasets they want to use in the evaluation-as-a-service framework for evaluating models, and which metrics. Anyone can upload models to the evaluation cloud, where scores and other metrics are computed on the selected datasets. Once those models have been uploaded and evaluated, they can be put in the loop for dynamic data collection and human-in-the-loop evaluation. Task owners can also collect data via the Web interface on dynabench.org, or with crowd workers on e.g. Mechanical Turk by using the Mephisto crowdsourcing tool suite.

One crucial aspect of Dynabench is that it can be used to evaluate current models with _humans in the loop_. Rather than having a static test set, we can have actual people try to find weaknesses in existing models, either by actively trying to fool them, or by identifying weaknesses in natural interactions. Alignment of AI models with real humans is crucial, especially since models are being deployed in more and more critical places in the world. The data that comes out of this process can be used to train up stronger models, or at the very least can help identify ways for constructing better models.

#### Concrete example that illustrates the different components:
Suppose there was no Natural Language Inference task yet, and we wanted to start one. We would log onto our Dynabench account, and on our profile page fill out the "Request new task" form. Once approved, we would have a dedicated task page that we control, as the task owner, via the corresponding admin dashboard. The first thing we would do is choose existing datasets that we want to evaluate models on when they are uploaded, along with the metrics we want to use for evaluation. Next, we would submit baseline models, or ask the community to submit them. If we then wanted to collect a new round of dynamic adversarial data, where workers are asked to create examples that the model gets wrong, we can upload new contexts to the system and start collecting data. Once we have enough data and if we find that training on the data helps improve the system, we can upload better models and put those in the data collection loop again so as to build even stronger models. The same basic process was used for constructing data sets like [Adversarial Natural Language Inference](https://arxiv.org/abs/1910.14599) and [Beat the AI](https://arxiv.org/abs/2002.00293). Our tools make it easy for anyone to construct datasets with humans and models in the loop.

## Table of Contents

This manual covers the following:
1. [Owners](#owners)
2. [Datasets](#datasets)
3. [Rounds](#rounds)
4. [Contexts](#contexts)
5. [Model evaluation](#model-evaluation)
6. [Collecting data](#collecting-data)
7. [Annotation configs](#annotation-configs)
8. [Frequently Asked Questions](#frequently-asked-questions)

This manual describes how Task Owners can configure their tasks through the task owner interface. To go to the task owner interface for your task, click on the "gear" icon in the top right-hand corner of your task page. Here's a useful checklist to go through the whole process of creating and setting up a dynatask:

1. Submit your task proposal
2. Configure your annotation config object
3. Add other task owners, if applicable
4. Add your relevant (leaderboard/non-leaderboard) datasets
5. Submit at least one model for evaluation
6. Create a round of data collection with a model in the loop
7. If applicable, add contexts

You can now collect new data, or if you like just use Dynabench as a leaderboard platform and start collecting data against your state-of-the-art models at a later stage.

## Owners

Every task can have multiple owners. The owners and their affiliations are displayed on the task page. Every task needs to have at least one registered owner on the Dynabench platformn. Owners can be added/removed under the Owners tab in the task owner interface.

## Datasets

Every task has two types of _datasets_: leaderboard and non-leaderboard datasets. The former show up on the leaderboard and are used for computing any aggregation metrics, such as the dynascore. The latter are only shown on the individual model page. Concrete examples would be: test sets would be leaderboard datasets, while dev sets, checklists and stress test sets would in most cases be non-leaderboard datasets.

Under the datasets tab in the task owners interface, you will be able to add, modify and remove new datasets for evaluation. New datasets are uploaded in a `jsonl` format, with fields corresponding to the fields defined in your [task annotation config](#annotation-config), as well as a `uid` field designating a unique identifier for the given example. For example, the first two lines for a classification task could read:

```
{'uid': '1', 'text': 'Hello world', 'label': 1}
{'uid': '2', 'text': 'Foo bar', 'label': 0}
```

If your task supports fairness and robustness evaluations, for every dataset you upload, you can also upload perturbed versions that will be used for the fairness and robustness metrics. In order to generate perturbations, use the tools in the `evaluation/scripts` directory.

## Rounds

Tasks can collect data over multiple _rounds_. A round of data collection usually (but not necessarily) has the same model(s) in the loop, and once finished usually becomes an leaderboard evaluation dataset. Task owners can export round data. Under the rounds tab in the task owners interface, you will be able to configure existing rounds, as well as to start new ones. Here, for example, you would determine what models to use in the loop, what contexts to collect data for, and with what settings.

## Contexts

Most tasks on Dynabench involve contextualized data collection: a question is written for a given passage or image, a hypothesis is written for a given premise, et cetera. For every round in your task, you can add contexts under the rounds tab by clicking . The format for a context corresponds to the fields defined in your [task annotation config](#annotation-config). Optionally, you can specify `tags` and filter for these tags if you customize your data collection frontend (e.g. when you want to collect Mechanical Turker data for a subset of your full dataset). The format for the contexts is `jsonl`. For example, the first two lines for a classification task could read:

```
{'context': 'Lorem ipsum dolor et cetera', 'tags': ['hello', 'world']}
{'context': 'Some other context', 'tags': ['goodbye']}
```

## Model evaluation

Most tasks on Dynabench involve _models in the loop_. Models are uploaded for evaluation via [Dynalab](https://github.com/facebookresearch/dynalab) and follow the input/output fields defined in your [task annotation config](#annotation-config). They are evaluated on all datasets. You can set the current models in the loop for every round under the rounds tab. For all models, users are encouraged to submit detailed model cards and provide as many details as they can. Only "published" models are shown on the task leaderboard. Task owners are encouraged to submit their own baselines shortly after task creation.

## Collecting data

Data collection consists of two components: creation and validation. In the former, new examples are created by Dynabench visitors or crowdworkers. In the latter, existing examples are validated to be correct. In both cases, interfaces exist both for regular web-based users as well as for Mechanical Turk workers, via [Mephisto](https://github.com/facebookresearch/Mephisto). Task owners can configure how exactly examples should be validated (e.g., how many validations are needed to consider an example validated, etc).

Data collection happens for the currently active round. Throughout the data collection process, data can be exported from the round and inspected at will. Scripts are provided for inspecting data and paying crowd workers bonuses.

## Annotation configs

The input/output format for a task, both in terms of what the model expects and how the annotator frontend behaves, are configured in the annotator config under the Advanced tab in the task owners interface. This is a JSON object that .. TBD - Tristan please insert pointers here (both for what I/O models would expect as well as what the create/validate interfaces would look like) and link to example json files.

## Frequently Asked Questions

### Why does my task not show up on the front page?

If your task has been accepted but does not show up, did you make it public by unchecking the "hidden" field? To give task owners some time to configure their task properly, tasks are initialized as hidden by default.

### Can I do something custom?

Absolutely! Dynabench is open source and a community effort: you are welcome to submit PRs. We would be happy to help if you have any questions. Please open an issue!
