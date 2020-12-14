# Copyright (c) Facebook, Inc. and its affiliates.
import sys

from models.badge import BadgeModel


sys.path.append("../")

bm = BadgeModel()
bm.handleAsync()
