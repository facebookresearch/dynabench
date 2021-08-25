# Copyright (c) Facebook, Inc. and its affiliates.

import bottle


@bottle.route("/")
def index():
    return "<b>Hello world</b>!"
