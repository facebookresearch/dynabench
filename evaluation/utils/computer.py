# Copyright (c) Facebook, Inc. and its affiliates.


class MetricsComputer:
    def __init__(self):
        pass

    def parse_outfile(self, file_s3_path):
        pass

    def update_database(self):
        pass

    def _compute_metrics(self, job: dict):
        pass

    def compute_metrics(self, jobs: list):
        for job in jobs:
            self._compute_metrics(job)
            self.update_database()
