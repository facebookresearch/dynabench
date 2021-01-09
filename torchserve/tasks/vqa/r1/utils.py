# Copyright (c) Facebook, Inc. and its affiliates.

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
