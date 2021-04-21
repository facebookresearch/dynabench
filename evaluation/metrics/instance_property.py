# Copyright (c) Facebook, Inc. and its affiliates.
# Properties taken from AWS documentation https://aws.amazon.com/sagemaker/pricing/

COMPUTE_CAP_CONSTANT = 10  # for score normalization to compute dynascore

instance_property = {
    "ml.m5.xlarge": {
        "instance_type": "ml.m5.xlarge",
        "device_type": "cpu",
        "cpu_count": 4,
        "gpu_count": 0,
        "memory_gb": 16,
        "compute_cap": COMPUTE_CAP_CONSTANT,
        "aws_metrics": ["examples_per_second", "memory_utilization"],
    }
}
