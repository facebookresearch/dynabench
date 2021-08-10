# isort:skip_file
import functools
import json
import logging
import sys
from typing import List

import func_argparse

sys.path.append("..")
sys.path.append("../../api")

from datasets.mt import flores
from eval_config import eval_config as config
from models.dataset import Dataset, DatasetModel
from models.score import ScoreModel
from models.task import TaskModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_bleu")


@functools.lru_cache()
def _get_dataset_name(dm: DatasetModel, did: int) -> str:
    return dm.dbs.query(Dataset.name).filter(Dataset.id == did).one()[0]


def main(task: str = "FLORES-SMALL1", writeback: bool = False):
    """Fix the BLEU score in the current DB.

    Dry-run by default, pass --writeback to actually write to the DB
    Note that this modification is idempotent, it's safe to run it several time.
    We are only modifying the overall "perf" field, not the per language scores.
    """
    sm = ScoreModel()
    dm = DatasetModel()
    tid = TaskModel().getByShortName(task.upper()).id
    perf_metric = "sp_bleu"

    for score in sm.getByTid(tid):
        if not score.metadata_json:
            continue
        metadata_json = json.loads(score.metadata_json)
        fixed = flores.compute_averages(perf_metric, metadata_json["perf_by_tag"])
        old_bleu = score.perf
        new_bleu = fixed["perf"]
        if writeback:
            sm.update(score.id, perf=fixed["perf"], pretty_perf=fixed["pretty_perf"])
        logger.info(
            f"Fixed score for model '{score.model.name}' ({score.mid}) on dataset '{_get_dataset_name(dm, score.did)}': {old_bleu} -> {new_bleu}"
        )


if __name__ == "__main__":
    func_argparse.single_main(main)
