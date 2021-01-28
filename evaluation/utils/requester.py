# Copyright (c) Facebook, Inc. and its affiliates.

# import utils.datasets


class Requester:
    def __init__(self):
        pass

    def eval_model_on_dataset(self, model_id, eval_id):
        # evaluate a given model on given datasets
        pass

    def eval_model(self, model_id):
        # given a model_id, evaluate all datasets for the
        # model's primary task
        eval_ids = []
        for eval_id in eval_ids:
            self.eval_model_on_dataset(model_id, eval_id)

    def eval_dataset(self, eval_id):
        # given a dataset id, evaluate all models for the
        # dataset's task
        model_ids = []
        for model_id in model_ids:
            self.eval_model_on_dataset(model_id, eval_id)
        pass
