# Evaluation server developer guide
## Terminology
A dataset: a single evaluation set that contains input examples and their corresponding labels.
A task: a collection of evaluation sets. Tasks are identified by a task code on evaluation cloud. Currently we have four published tasks: nli, hs, sentiment and qa.
## Tasks
Assume you've added a new task in Dynabench database, whose task code is `my-task` and task id is `n`. To start model upload and evaluation for your task, first create a new file in `dynalab` repo (https://github.com/facebookresearch/dynalab) at
```
dynalab/tasks/my-task.py
```
We now define the expected input and output for all models that belong to this task, i.e. task I/O. Since both input and output will be json serialized, defining the I/O is essentially defining the keys of the json object. To define the input format, simply add a test input example, such as
```
data = {
    "uid": "xxx",
    "context": "this is a test example",
    "hypothesis": "which specifies the input keys",
}
```
Note your input should always contain an `id` or equivalent field to uniquely identify an example. This defines the full set of input keys.

The output format is defined by a `verify_response` method that will be used to validate model response, i.e. a single json object. The model output should encompass both the keys for batch evaluation (i.e. an example identifier passed from input, and a definite prediction) and talking to the endpoint (e.g. some additional insights of the inference such as probability list). To do this, declare a `TaskIO` class that inherits `BaseTaskIO`. Your class has to be called `TaskIO` so don't rename it. This function defines the full set of output keys.
```
from dynalab.tasks.common import BaseTaskIO
class TaskIO(BaseTaskIO):
    def __init__(self):
        BaseTaskIO.__init__(self, data)
    def verify_response(self, response):
        # define your method here, the following code is just a demo
        assert "id" in response and response["id"] == self.data["uid"]
        assert "pred" in response and isinstance(response["pred"], dict)
        assert "prob" in response, "prob must be in response"
```
Now that we've defined the task I/O, let's go back to dynabench and sync these requirements. In dynabench, you need to add / update the task config at
```
evaluation/metrics/task_config.py
```
See the existing configs there for how to add / update configs. Specifically, the `input_keys` field is usually the list of keys in the test example provided in dynalab, but can exclude keys that are not directly involved in evaluation, e.g. request insights when talking to an endpoint, if your model supports that. In our examples you should set
```
{
    "input_keys": ["uid", "context", "hypothesis"]
}
```

## Datasets
A dataset is identified by a unique string (dataset name) that consists of lower case letters, numbers and dash (-) only. Registered new datasets will be uploaded to our S3 bucket and written into prod database, which will then trigger evaluations on all models belong to the dataset's task. For standard datasets, you only need to take care of the sending to S3 and field conversions, and all the rest are shared pipelines. It's also possible to implement non-standard datasets, but you will need to implement the evaluation functions to make it compatible with upstream uploaded models and downstream APIs.

Standard dataset files are normally `.jsonl` files where each line is an input example in json format. To register a new standard dataset,

1. All datasets should inherit the base class
   ```
   datasets.common.BaseDataset
   ```
   which requires defining the dataset name, task code, and round id. If your dataset does not belong to any rounds, set it to 0.
2. You must implement all the abstract methods for your dataset, and currently these include `load`, `label_field_converter` and `pred_field_converter`.

    2.1 `def load(self) -> bool`

    This is the function to send the dataset to pre-defined S3 path and should be implemented for each dataset. The examples in the input file must include all keys specified in your dynalab test example, plus the labels for computing metrics. Therefore, this function will normally contain two steps: input field conversion and send to S3.
    The S3 path information can be obtained from pre-defined base attributes and methods:
    ```
    {
        s3_bucket: self.task.s3_bucket,
        s3_path: self._get_data_s3_path()
    }
    ```
    2.2 `def label_field_converter(self, example)`

    This is the function to extract the label in your dataset file and convert it into the format expected by self.eval, hence it can be implemented on dataset level. The conversion is for each single example. The converted example should always look like
    ```
     {
         "id":
         "answer":
         "tags":
     }
    ```
    where `id` is the unique example identifier, `answer` is the correct label and forms the element in the the expected `targets` in your task metric function (see `Metrics` section for more information). `tags` are a list of strings that assign some additional information to each example for extra analysis, and the metrics will be computed for each tag and stored in `perf_by_tag`. You can assign an empty list `[]` here if there are no tags.

    2.3 `def pred_field_converter(self, example)`

    This is the function to convert model output to the format expected by self.eval. Since model output are defined per task (by task I/O in dynalab), this function should be implemented on task level (i.e. same for all datasets belong to that task). It should always look like
     ```
     {
         "id":
         "pred":
     }
     ```
    where `id` is the example identifier, and `pred` is the final prediction from the model that will be used to compute metrics.
3. Once the class is implemented, you need to register your dataset in
   ```
   datasets.__init__.load_datasets
   ```
   The key is your unique dataset name, same as your `dataset.name` attribute, and the value is the pointer to your dataset class with instantiation.

When the evaluation server starts, it will call `load_datasets` function and scan all registered datasets. On dataset instantiation, a dataset will be sent to S3 using the `load` function if not already present there. Then if the dataset is present on S3, it will add this dataset into `datasets` table if not already present, and upon successful creation of db entry it will send a request to evaluate all existing models belonging to that task. Note that evaluation request is triggered by new entries in db (which will only happen if a dataset exists on S3), and merely uploading datasets to S3 (e.g. updating the dataset content) will not trigger new evaluations.


## Metrics
The evaluation metrics, such as accuracy, f1, etc. are implemented in the metrics module. To add a new metric, you need to
1. Implement the computation function in `metrics.metrics`, the function header should always be
   ```
   get_<metric_name>(predictions:list, targets:list)
   ```
    If this is a perf metric, which will be used as the main metric for sorting, the output should normally be a floating number. For existing examples, look for `metrics.metrics.get_accuracy` and `metrics.metrics.get_f1` for implementation of accuracy and f1.

2. Register the metric in the config so that it can be used in evaluations by updating the
   ```
   metrics.metric_config.eval_metrics_config
   ```
   Your metric should have a unique name as a key, and the pointer to the metric implementation as the value.

3. Start to use the metric in tasks, by adding your metric in
   ```
   metrics.task_config
   ```
   for your task. You can either add your metric as one of the `eval_metrics`, whose value will be stored as an entry in the metric json object for query, or use it as the `perf_metric` to sort models. Note that the changes will only take effect on new evaluations requested after the codebase has been deployed. Computing a new metric on retrospective evaluations is yet to be supported.

## Perturb datasets
Use the scripts in scripts folder to perturb datasets and request evaluation.
For example, to perturb a dataset for task nli to fairness dataset, do
```
cd scripts
python perturb.py --s3-uri <s3-uri> --task nli --perturb-prefix fairness
```
The `s3-uri` is the "S3 URI" under "Object overview" in S3, and it should point to an original dataset (i.e. unperturbed version). S3 uri is usually in the format of `s3://{bucket}/{path}`.

Follow the prompt to check the output and if everything looks good, copy paste the given command to upload the dataset and request an evaluation.
