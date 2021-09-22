# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

import requests
from PIL import Image


def image_loader(path):
    if os.path.exists(path):
        with open(path, "rb") as f:
            bytes = f
    else:
        bytes = requests.get(path, stream=True).raw

    img = Image.open(bytes)
    return img.convert("RGB")
