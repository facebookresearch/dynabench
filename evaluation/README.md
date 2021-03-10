# Evaluation server developer guide

## Tasks
To add new tasks, you need to add / update the task config at
```
metrics.task_config
```
See the existing configs there for how to add / update configs.

At the moment, you need to define the task I/O in both Dynalab and Dynabench. The input for prediction is defined in

```
dynalab.tasks.<your_task> # by providing test example
```
and
```
metrics.task_config[<your_task>].input_keys # by providing the list of input keys
```
i.e. the keys in the two places should be exactly the same.

The handler output is defined by
```
dynalab.task.TaskIO.verify_response
```
which is a function to verify model output, including both the keys used for batch evaluation (i.e. used in `dataset.pred_field_converter`) and `CreateInterface`.

## Datasets
A dataset is identified by a unique string (dataset name) that consists of lower case letters, numbers and dash (-) only. Registered new datasets will be uploaded to our S3 bucket and written into prod database, which will then trigger evaluations on all models belong to the dataset's task. For standard datasets, you only need to take care of the sending to S3 and field conversions, and all the rest are shared pipelines. It's also possible to implement non-standard dataset, but you will need to implement the evaluation functions to make it compatible with upstream uploaded models and downstream APIs.

Standard dataset files are normally `.jsonl` files where each line is an example expressed in json format. To register a new standard dataset,

1. All datasets should inherit the
   ```
   datasets.common.BaseDataset
   ```
   and requires defining the dataset name, task code, and round id. If your dataset does not belong to any rounds, set it to 0.
2. You need to implement all the abstract methods for your dataset, currently these include `load`, `label_field_converter` and `pred_field_converter`.

    2.1 `def load(self) -> bool`

    This is the function to send the dataset to pre-defined S3 path and should be implemented for each dataset. The dataset file must include both input and correct output. There are two steps involved for this function: input field conversion and send to S3.

    Input field conversion must be consistent with those expected in
    ```
    metrics.task_config[<your_task>].input_keys
    ```
    and bear in mind that only these keys will be sent to model for inference.

    The S3 path information can be obtained by
    ```
    {
        s3_bucket: self.s3_bucket,
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
    where `id` is the example identifier to join the example and model prediction. `answer` is the correct label and forms the element in the the expected `targets` in your task metric function (see `Metrics` section for more information). `tags` are a list of strings that assign some additional information to each example for extra analysis, and the metrics will be computed for each tag and stored in `perf_by_tag`.

    2.3 `def pred_field_converter(self, example)`

    This is the function to convert model output to the format expected by self.eval. Since model output are defined per task (by task I/O in dynalab), this function should be implemented on task level (i.e. same for all datasets belong to that task). It should always look like
     ```
     {
         "id":
         "pred":
     }
     ```
    where `id` is the example identifier same as that in `label_field_converter`. `pred` is the final prediction from the model that will be used to compute metrics.
3. Once the class is implemented, you need to register your dataset in
   ```
   datasets.__init__.load_datasets
   ```
   The key is your unique dataset name, same as your `dataset.name` attribute, and the value is the pointer to your dataset class with instantiation.

When evaluation server starts, it will call `load_datasets` function and scan all registered datasets. On dataset instantiation, a dataset will be sent to S3 using the `load` function if not already present there. Then if the dataset is present on S3, it will add this dataset into `datasets` table if not already present, and upon successful creation of db entry it will send a request to evaluate all existing models belonging to that task. Note that evaluation request is triggered by new entries in db (which will only happen if a dataset exists on S3), and merely uploading datasets to S3 (e.g. updating the dataset content) will not trigger new evaluations.


## Metrics
The evaluation metrics, such as accuracy, f1, etc. are implemented in the metrics module. To add a new metric, you need to
1. Implement the compuation function in `metrics.metrics`, the function header should always be
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
