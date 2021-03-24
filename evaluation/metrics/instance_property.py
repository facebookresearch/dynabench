# Copyright (c) Facebook, Inc. and its affiliates.

COMPUTE_CAP_CONSTANT = 10

instance_property = {
    "ml.m5.xlarge": {
        "instance_type": "ml.m5.xlarge",
        "device_type": "cpu",
        "cpu_count": 4,
        "gpu_count": 0,
        "memory_gb": 32,
        "compute_cap": COMPUTE_CAP_CONSTANT,
        "aws_metrics": ["memory_utilization", "seconds_per_example"],
    }
}
