# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import ujson
from ujson import loads  # noqa


# this module's sole purpose is to ensure that ujson's default behaviour
# conforms to the default Python json module. this specifically concerns
# the escaping of forward slashes, which the Python json module does not
# do by default. see: https://github.com/ultrajson/ultrajson/issues/110


def dumps(*args, **kwargs):
    if "escape_forward_slashes" not in kwargs:
        kwargs["escape_forward_slashes"] = False
    return ujson.dumps(*args, **kwargs)
