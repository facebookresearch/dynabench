# Copyright (c) Facebook, Inc. and its affiliates.

from models.refresh_token import RefreshTokenModel


rtm = RefreshTokenModel()
rtm.removeTokensOlderThanMonth()
