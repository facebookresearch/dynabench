# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import functools
import logging
import pickle
from typing import Optional

import ujson
from enum import Enum

from eval_config import eval_config
from utils.evaluator import Job
from utils.helpers import (
    api_get_next_job_score_entry,
    api_model_eval_update,
    api_update_database_with_metrics,
)


logger = logging.getLogger("computer")
DYNABENCH_API = eval_config["DYNABENCH_API"]


class ComputeStatusEnum(Enum):
    successful = "successful"
    failed = "failed"
    postponed = "postponed"


class MetricsComputer:
    def __init__(self, config, datasets):
        self._status_dump = config["computer_status_dump"]
        self._waiting, self._failed = self._load_status()
        self._computing = []
        self.datasets = datasets

    def _load_status(self):
        try:
            status = pickle.load(open(self._status_dump, "rb"))
            logger.info(f"Load existing status from {self._status_dump}.")
            # When reloading, we consider that "computing" job have been interrupted
            # and we need to recompute them
            computing = status["computing"] + status.get("waiting", [])
            return computing, status["failed"]
        except FileNotFoundError:
            logger.info("No existing computer status found. Re-initializing...")
            return [], []
        except Exception as ex:
            logger.exception(
                f"Exception in loading computer status: {ex}. Re-initializing..."
            )
            return [], []

    def update_database_with_metrics(
        self, job, eval_metrics_dict: dict, delta_metrics_dict: dict
    ) -> None:
        # cal api with job, eval metrics dict, delta metrics dict
        dataset = self.datasets[job.dataset_name]
        data = {
            "job": ujson.dumps(job.as_dict(), default=str),
            "eval_metrics_dict": ujson.dumps(eval_metrics_dict, default=str),
            "delta_metrics_dict": ujson.dumps(delta_metrics_dict, default=str),
            "dataset": ujson.dumps(dataset.as_dict(job.endpoint_name), default=str),
        }
        model_json = api_update_database_with_metrics(DYNABENCH_API, data)
        print("in update db with metrics")
        print(model_json)
        # mm = ModelModel()
        # model = mm.get(job.model_id)
        # # Don't change model's evaluation status if it has failed.
        # if model.evaluation_status != EvaluationStatusEnum.failed:
        #     if model.evaluation_status != EvaluationStatusEnum.evaluating:
        #         model.evaluation_status = EvaluationStatusEnum.evaluating
        #         mm.dbs.add(model)
        #         mm.dbs.flush()
        #         mm.dbs.commit()

        # dm = DatasetModel()
        # d_entry = dm.getByName(job.dataset_name)
        # sm = ScoreModel()
        # s = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)

        # dataset = self.datasets[job.dataset_name]
        # if job.perturb_prefix:
        #     assert s is not None
        #     eval_metadata_json = json.loads(eval_metrics_dict["metadata_json"])
        #     eval_metadata_json = {
        #         f"{job.perturb_prefix}-{metric}": eval_metadata_json[metric]
        #         for metric in eval_metadata_json
        #     }
        #     metadata_json = update_metadata_json_string(
        #         s.metadata_json,
        #         [json.dumps(eval_metadata_json), delta_metrics_dict["metadata_json"]],
        #     )
        #     score_obj = {**delta_metrics_dict, "metadata_json": metadata_json}
        #     sm.update(s.id, **score_obj)
        # else:
        #     job_metrics_dict = get_job_metrics(job, dataset)
        #     score_obj = {**eval_metrics_dict, **job_metrics_dict}
        #     if s:
        #         score_obj["metadata_json"] = update_metadata_json_string(
        #             s.metadata_json, [score_obj["metadata_json"]]
        #         )
        #         sm.update(s.id, **score_obj)
        #     else:
        #         score_obj["model_id"] = job.model_id
        #         score_obj["did"] = d_entry.id
        #         score_obj["raw_output_s3_uri"] = dataset.get_output_s3_url(
        #             job.endpoint_name
        #         )

        #         rm = RoundModel()
        #         if dataset.round_id != 0:
        #             score_obj["r_realid"] = rm.getByTidAndRid(
        #                 d_entry.tid, d_entry.rid
        #             ).id
        #         else:
        #             score_obj["r_realid"] = 0
        #         sm.create(**score_obj)

        if job in self._computing:
            self._computing.remove(job)
        self.dump()

        # Don't change model's evaluation status if it has failed.
        if model_json["evaluation_status"] != "failed":
            model_done_evaluating = True
            for other_job in self._waiting + self._computing:
                if other_job.model_id == job.model_id:
                    model_done_evaluating = False
            if model_done_evaluating:
                api_model_eval_update(DYNABENCH_API, model_json["id"], "completed")
                # model.evaluation_status = EvaluationStatusEnum.completed
                # mm.dbs.add(model)
                # mm.dbs.flush()
                # mm.dbs.commit()

        logger.info(f"Successfully evaluated {job.job_name}")

    def update_status(self, jobs: list):
        if jobs:
            self._waiting.extend(jobs)
            self.dump()

    def log_job_error(self, job, ex):
        logger.exception(ex)
        if job in self._computing:
            self._computing.remove(job)
        self._failed.append(job)
        api_model_eval_update(DYNABENCH_API, job.model_id, "failed")
        # mm = ModelModel()
        # model = mm.get(job.model_id)
        # model.evaluation_status = EvaluationStatusEnum.failed
        # mm.dbs.add(model)
        # mm.dbs.flush()
        # mm.dbs.commit()

    def compute_one_blocking(self, job) -> None:
        try:

            logger.info(f"Evaluating {job.job_name}")
            self._computing.append(job)
            dataset = self.datasets[job.dataset_name]
            eval_metrics, delta_metrics = dataset.compute_job_metrics(job)
            self.update_database_with_metrics(job, eval_metrics, delta_metrics)

        except Exception as e:
            self.log_job_error(job, e)
            return

    def compute_one_async(self, process_pool, job):
        try:
            dataset = self.datasets[job.dataset_name]
            process_pool.apply_async(
                dataset.compute_job_metrics,
                args=(job,),
                callback=lambda res: self.update_database_with_metrics(job, *res),
                error_callback=functools.partial(self.log_job_error, job),
            )
        except Exception as e:
            self._failed.append(job)
            logger.error(
                f"Couldn't start the final evaluation for {job}."
                " Probably due to a pickling error"
            )
            logger.exception(e)
            self.dump()
            return

        self._computing.append(job)
        self.dump()

    def find_next_ready_job(self) -> Optional[Job]:
        """Finds the next job ready to start evaluating.

        Returns None if none of the job are ready.

        Note: the job returned doesn't belong anymore to any of the internal lists
        and need to be added back (eg by passing it to `compute_one_async`)
        """
        # dm = DatasetModel()
        # sm = ScoreModel()

        n = len(self._waiting)
        traversed = 0
        while self._waiting and traversed < n:
            job = self._waiting.pop(0)
            traversed += 1

            # d_entry = dm.getByName(job.dataset_name)
            # score_entry = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)
            score_entry = api_get_next_job_score_entry(DYNABENCH_API, job.as_dict())

            if job.perturb_prefix and not score_entry:
                logger.info(
                    f"Haven't received original evaluation for {job.job_name}. "
                    f"Postpone computation."
                )
                self._waiting.append(job)
            else:
                self.dump()
                return job
        return None

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Computing":
            return self._computing
        elif status == "Waiting":
            return self._waiting
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def get_status(self) -> dict:
        return {
            "computing": self._computing,
            "waiting": self._waiting,
            "failed": self._failed,
        }

    def dump(self):
        # dump status to pre-specified path
        status = self.get_status()
        logger.info(
            f"Computer status: \n"
            + f"waiting jobs: {[job.job_name for job in status['waiting']]}\n"
            + f"computing jobs: {[job.job_name for job in status['computing']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Computer dumped status to {self._status_dump}")
