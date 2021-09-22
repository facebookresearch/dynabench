# Task Owners Manual

If you’re already familiar with the platform, you can probably skip this high-level overview:

Dynabench is organized around _tasks_ (e.g. [NLI](https://dynabench.org/tasks/nli) or [QA](https://dynabench.org/tasks/qa)). Each task can have one or more owners, who have control over how the task is set up. For example, task owners can specify which metrics and datasets they want to use in the [evaluation-as-a-service](https://arxiv.org/abs/2106.06052) framework for evaluating models. Anyone can upload models to the evaluation cloud, where scores for metrics are computed on the selected datasets. Once those models have been uploaded and evaluated, they can be put in the loop for dynamic data collection and human-in-the-loop evaluation. Task owners can collect data via the Web interface on dynabench.org, or with crowd workers on e.g. Mechanical Turk by using the Mephisto crowdsourcing tool suite.

One crucial aspect of Dynabench is that it can be used to evaluate current models with _humans in the loop_. Rather than having a static test set, we can have actual people try to find weaknesses in existing models, either by actively trying to fool them, or by identifying weaknesses in natural interactions. Alignment of AI models with real humans is crucial, especially as models are deployed in more and more critical places in the world. The data that comes out of this process can be used to train stronger models, or at the very least can help identify ways to construct better models.

#### Concrete example that illustrates the different components:
Suppose there was no Natural Language Inference task yet, and we wanted to start one. We would log onto our Dynabench account, and on our profile page fill out the "Request new task" form. Once approved, we would have a dedicated task page that we control, as the task owner, via the corresponding task owner page. The first thing we would do is choose existing datasets that we want to evaluate models on when they are uploaded, along with the metrics we want to use for evaluation. Next, we would submit baseline models, or ask the community to submit them. If we then wanted to collect a new round of dynamic adversarial data, where workers are asked to create examples that the models get wrong, we can upload new contexts to the system and start collecting data. Once we have enough data and if we find that training on the data helps improve the system, we can upload better models and put those in the data collection loop again so as to build even stronger models. The same basic process was used for constructing data sets like [Adversarial Natural Language Inference](https://arxiv.org/abs/1910.14599) and [Beat the AI](https://arxiv.org/abs/2002.00293). Our tools make it easy for anyone to construct datasets with humans and models in the loop.

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

Every task has two main types of _datasets_: leaderboard and non-leaderboard datasets. The former show up on the [leaderboard](https://dynabench.org/tasks/hs) and are used for computing any aggregation metrics, such as the dynascore. The latter are only shown on the [individual model page](https://dynabench.org/models/69). Concrete examples would be: test sets would be leaderboard datasets, while dev sets, checklists and stress test sets would in most cases be non-leaderboard datasets.

Under the datasets tab in the task owners interface, you will be able to add, modify and remove new datasets for evaluation. New datasets are uploaded in a `jsonl` format, with fields corresponding to the fields defined in your [task annotation config](#annotation-config), as well as a `uid` field designating a unique identifier for the given example. For example, the first two lines for a classification task could read:

```
{'uid': '1', 'text': 'Hello world', 'label': 1}
{'uid': '2', 'text': 'Foo bar', 'label': 0}
```

If your task supports fairness and robustness evaluations, for every dataset you upload, you can also upload perturbed versions that will be used for the fairness and robustness metrics. In order to generate perturbations, use the tools in the `evaluation/scripts` directory.

## Rounds

Tasks can collect data over multiple _rounds_. A round of data collection usually (but not necessarily) has the same model(s) in the loop, and once finished usually becomes a leaderboard evaluation dataset. Task owners can export round data. Under the rounds tab in the task owners interface, you will be able to configure existing rounds, as well as to start new ones. Here, for example, you would determine what models to use in the loop, what contexts to collect data for, and with what settings.

## Contexts

Most tasks on Dynabench involve contextualized data collection: a question is written for a given passage or image, a hypothesis is written for a given premise, et cetera. For every round in your task, you can add contexts under the rounds tab by clicking the "Upload Contexts" section. The format for a context corresponds to the fields defined in your [task annotation config](#annotation-config). Optionally, you can specify `tags` and filter for these tags if you customize your data collection frontend (e.g. when you want to collect Mechanical Turker data for a subset of your full dataset). The format for the contexts is `jsonl`. For example, the first two lines for a classification task could read:

```
{'context': {'statement': 'Lorem ipsum dolor et cetera'}, 'tags': ['hello', 'world']}
{'context': {'statement': 'Some other context'}, 'tags': ['goodbye']}
```

## Model evaluation

Most tasks on Dynabench involve _models in the loop_. Models are uploaded for evaluation via [Dynalab](https://github.com/facebookresearch/dynalab) and follow the input/output fields defined in your [task annotation config](#annotation-config). They are evaluated on all datasets. You can set the current models in the loop for every round under the rounds tab. For all models, users are encouraged to submit detailed model cards and provide as many details as they can. Only "published" models are shown on the task leaderboard. Task owners are encouraged to submit their own baselines shortly after task creation.

## Collecting data

Data collection consists of two components: creation and validation. In the former, new examples are created by Dynabench visitors or crowdworkers. In the latter, existing examples are validated to ensure correctness. In both cases, interfaces exist both for regular web-based users as well as for Mechanical Turk workers, via [Mephisto](https://github.com/facebookresearch/Mephisto). Task owners can configure how exactly examples should be validated (e.g., how many validations are needed to consider an example fully validated, etc).

Data collection happens for the currently active round. Throughout the data collection process, data can be exported via the task owner page and inspected at will. Scripts are provided for inspecting data and paying crowd workers bonuses.

## Annotation configs

The input/output format for a task, both in terms of what the model expects and how the annotator frontend behaves, are configured in the annotation config under the Advanced tab in the task owners interface. Here are examples of annotator configs for NLI, QA, Sentiment Analysis, Hate Speech Detection, and Machine Translation, followed by an explanation for each of the fields in the annotation config:

1. NLI:

```
 {
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "accuracy", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "hypothesis", "type": "string",
                    "constructor_args": {"placeholder": "Enter hypothesis..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["entailed", "neutral", "contradictory"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
                ],
                "metadata": {
                "create":
                [
                    {"name": "example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why your example is correct..."},
                        "display_name": "example explanation"},
                    {"name": "model_explanation_right", "type": "string",
                        "constructor_args": {"placeholder":
                        "Explain why you thought the model would make a mistake..."},
                        "model_wrong_condition": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong_condition": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["entailed", "neutral", "contradictory"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_label_condition": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_label_condition": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_label_condition": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_label_condition": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
```

2. QA

```
            {
                "model_wrong_metric": {"type": "string_f1", "constructor_args":
                    {"reference_name": "answer", "threshold": 0.9}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "squad_f1", "constructor_args":
                    {"reference_name": "answer"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "goal_message":
"enter a question and select an answer in the context, such that the model is fooled.",
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "question", "type": "string",
                    "constructor_args": {"placeholder": "Enter question..."}},
                    {"name": "answer", "type": "context_string_selection",
                    "constructor_args": {
                        "reference_name": "context"}}],
                "output": [
                    {"name": "answer", "type": "context_string_selection",
                        "constructor_args": {
                            "reference_name": "context"}},
                    {"name": "conf", "type": "conf",
                        "constructor_args": {}}
                ],
                "metadata": {
                "create":
                [
                    {"name": "example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why your example is correct..."},
                        "display_name": "example explanation"},
                    {"name": "model_explanation_right", "type": "string",
                        "constructor_args": {"placeholder":
                        "Explain why you thought the model would make a mistake..."},
                        "model_wrong_condition": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong_condition": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_answer",
                        "type": "context_string_selection",
                        "constructor_args": {"reference_name": "context"},
                        "validated_label_condition": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_label_condition": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_label_condition": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_label_condition": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
```

3. Sentiment Analysis

```
{
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "macro_f1", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["negative", "positive", "neutral"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["negative", "positive", "neutral"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
                ],
                "metadata": {
                "create":
                [
                    {"name": "example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why your example is correct..."},
                        "display_name": "example explanation"},
                    {"name": "model_explanation_right", "type": "string",
                        "constructor_args": {"placeholder":
                        "Explain why you thought the model would make a mistake..."},
                        "model_wrong_condition": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong_condition": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["negative", "positive", "entailed"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_label_condition": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_label_condition": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_label_condition": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_label_condition": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
```

4. Hate Speech Detection

```
            {
                "model_wrong_metric": {"type": "exact_match", "constructor_args":
                    {"reference_names": ["label"]}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "macro_f1", "constructor_args":
                    {"reference_name": "label"}},
                "delta_metrics": [{"type": "fairness", "constructor_args": {}},
                    {"type": "robustness", "constructor_args": {}}],
                "content_warning":
        "This is sensitive content! If you do not want to see any hateful examples, please switch to another task.", 
                "context": [{"name": "context", "type": "string",
                    "constructor_args": {"placeholder": "Enter context..."}}],
                "input": [{"name": "statement", "type": "string",
                    "constructor_args": {"placeholder": "Enter statement..."}},
                    {"name": "label", "type": "target_label",
                    "constructor_args": {
                        "labels": ["not-hateful", "hateful"]}}],
                "output": [
                    {"name": "label", "type": "target_label",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"]}},
                    {"name": "prob", "type": "multiclass_probs",
                        "constructor_args": {"reference_name": "label"}}
                ],
                "metadata": {
                "create":
                [
                    {"name": "example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why your example is correct..."},
                        "display_name": "example explanation"},
                    {"name": "model_explanation_right", "type": "string",
                        "constructor_args": {"placeholder":
                        "Explain why you thought the model would make a mistake..."},
                        "model_wrong_condition": false,
                        "display_name": "model explanation"},
                    {"name": "model_explanation_wrong", "type": "string",
                        "constructor_args": {"placeholder":
                            "Explain why you think the model made a mistake..."},
                            "model_wrong_condition": true,
                            "display_name": "model explanation"}
                ],
                "validate":
                [
                    {"name": "corrected_label",
                        "type": "multiclass",
                        "constructor_args": {
                            "labels": ["not-hateful", "hateful"],
                            "placeholder": "Enter corrected label"
                            },
                        "validated_label_condition": "incorrect"},
                    {"name": "target_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder":
                                "Explain why your proposed target is correct..."},
                        "validated_label_condition": "incorrect"},
                    {"name": "flag_reason", "type": "string",
                        "constructor_args":
                            {"placeholder": "Enter the reason for flagging..."},
                        "validated_label_condition": "flagged"},
                    {"name": "validator_example_explanation", "type": "string",
                        "constructor_args":
                            {"placeholder": "Explain why the example is correct..."},
                        "validated_label_condition": "correct"},
                    {"name": "validator_model_explanation", "type": "string",
                        "constructor_args": {"placeholder":
                        "Enter what you think was done to try to trick the model..."}}
                ]
                }
            }
```

5. Machine Translation

```
 {
                "model_wrong_metric": {"type": "ask_user", "constructor_args": {}},
                "aggregation_metric": {"type": "dynascore", "constructor_args": {}},
                "perf_metric": {"type": "sp_bleu", "constructor_args":
                    {"reference_name": "targetText"}},
                "delta_metrics": [],
                "context": [
                    {"name": "sourceLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter source language..."}},
                    {"name": "targetLanguage", "type": "string",
                    "constructor_args": {"placeholder": "Enter target language..."}}],
                "input": [{"name": "sourceText", "type": "string",
                    "constructor_args": {"placeholder": "Enter source text..."}},
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "output": [
                    {"name": "targetText", "type": "string",
                        "constructor_args": {"placeholder": "Enter target text"}}],
                "metadata": {"create": [], "validate": []}
            }
```

The annotation config can have the following fields:

1. `goal_message` (optional): a string that is displayed at the top of the create interface as a goal for annotators. [See an example](https://dynabench.org/tasks/qa/create)

2. `content_warning` (optional): a string that is displayed at the top of the validate interface as a warning to validators. [See an example](https://dynabench.org/tasks/hs/validate)

3. `model_wrong_metric`: This defines whether a person fooled a model. There are three options to choose from: `exact_match`, `string_f1`, and `ask_user`:

3.1. `exact_match` requires `reference_names` as a constructor arg, which is a list of names of the model outputs that you want to compare with the annotator inputs.

3.2. `string_f1` requires `reference_name` as a constructor arg, which is a name of the model output that you want to compare with the annotator input. The `threshold` is  a number between 0 and 1 and is also a required constructor arg.

3.3. `ask_user` does not require any constructor args; it tells the create interface to ask the annotator whether the model was fooled or not.

4. `aggregation_metric`: This is a string that defines how the leaderboard ranks models. There is only one aggregation metric to choose: `dynascore`.

5. `perf_metric`: This is the metric that is used to evaluate the performance of an uploaded model. There are six to choose from: `macro_f1`, `squad_f1`, `accuracy`, `bleu`, `sp_bleu`, `vqa_accuracy`.

They all require `reference_name` as a constructor arg, which specifies which model output to use to compute the score. The score is computed by comparing the model output keyed by `reference_name` with the gold output keyed by `reference_name` in an uploaded dataset.

If you are using `squad_f1`, `accuracy`, or `vqa` accuracy, you have the option of uploading datasets with a list of candidates keyed by `reference_name` instead of just one. For example:
Model output for an example: `{“answer”: “the sky is blue”}`
Example in the dataset: `{“question”: “What color is the sky?”, “answer”: [“the sky is blue”, “the sky is light blue”, “the sky is cerulean”]}`

6. `delta_metrics`: A delta metric returns the value that the perf metric would return, if it was run on a perturbed version of the dataset. There are two to choose from: `fairness` and `robustness`; neither require any constructor_args. If you select either of these delta_metrics, then any datasets that you upload for your task must be accompanied by the corresponding perturbed versions. We have released the tools that we use for perturbing Hate Speech, Question Answering, Natural Language Inference, and Sentiment Analysis datasets here: (TODO).

7. `context`, `input`, `output`: These are lists of objects that define the I/O for a task. There must be at least one object in each list for a task to be valid. `context` is the example information that task owner provides. `input` is the example information that the annotators enter. `output` is what the model outputs, given `input` and `context`. When objects in `input` and `output` have the same name, a model receives the input without these objects. For example: if an annotator is asked to provide a target label in their input and a model is asked to return a label to compare to this target label, the target label is filtered out of the annotator’s input before it is sent to the model.

8. `metadata` is a dictionary containing two lists which are keyed by `create` and `validate`. Just like `context`, `input`, and `output`, these are also lists of objects that define the I/O for a task, except they are optional. The objects defined in `create` appear after an annotator enters an example into the create interface, and so is dependent on a model’s response. For the objects in `create`, you can specify `model_wrong_condition` as `true` or `false` to define whether these objects appear when the annotator’s example is model fooling or not. You can also not specify `model_wrong_condition` if you want any of the objects to always appear in the model response section of the create interface. The objects defined in `validate` appear in the validate interface after a validator has selected `flagged`, `correct`, or `incorrect`. For the objects in `validate`, you can specify `validated_label_condition` as `incorrect`, `correct` or `flagged` to define the conditions where you show these objects to validators. You can also not specify `validated_label_condition` if you want an object to always appear in the validate interface.

9. Objects that compose the I/O for a task: In 7 and 8, we explained where to enter objects that compose the I/O for a task. We call them “annotation objects” Here are the options that you can select from:

9.1 `string`: Data for this type is stored as a string. `placeholder` is a required constructor arg.

9.2: `context_string_selection`: Data for this type is stored as a string; it must be a substring of another annotation object in `context`. `reference_name` designates the name of a string-type object in the context to select from, and it is a required constructor arg.

9.3: `target_label`: Data for this type is stored as a string; it must be from a set of owner-defined labels. `labels` is a list of strings that defines the set of available labels, and it is a required constructor arg.

9.4: `multiclass`: Data for this type is stored as a string; it must be from a set of owner-defined labels. The only difference between this type and the `target_label` type is how it is displayed to annotators on the frontend. `target_label` is displayed as a goal message with an embedded dropdown component ([see an example](https://dynabench.org/tasks/nli/create)), and `multiclass` is displayed as a basic multiple choice dropdown component. `labels` is a list of strings that defines the set of available labels, and it is a required constructor arg.

9.5: `multiclass_probs`: Data for this type is stored as a dictionary, where a key is a label name and a value is a float. Values should sum to 1. `reference_name` designates the name of a `multiclass` or `target_label` object to get the labels from, and it is a required constructor arg. This annotation object cannot be used in the `input`.

9.6: `conf`: Data for this type is stored as a float between 0 and 1. It typically represents the confidence of a model about its answer. This annotation object cannot be used in the `input`. 

## Frequently Asked Questions

### Why does my task not show up on the front page?

If your task has been accepted but does not show up, did you make it public by unchecking the "hidden" field? To give task owners some time to configure their task properly, tasks are initialized as hidden by default.

### Can I do something custom?

Absolutely! Dynabench is open source and a community effort: you are welcome to submit PRs. We would be happy to help if you have any questions. Please open an issue!
