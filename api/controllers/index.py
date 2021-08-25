# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import bottle


@bottle.route("/")
def index():
    return "<b>Hello world</b>!"
