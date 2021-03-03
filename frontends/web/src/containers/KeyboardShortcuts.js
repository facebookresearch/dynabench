/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

class KeyboardShortcuts extends React.Component {
  keydownListener = (e) => {
    const loweredKey = e.key.toLowerCase();
    const { mapKeyToCallback, allowedShortcutsInText } = this.props;
    if (e.repeat) {
      return;
    }
    if (mapKeyToCallback[loweredKey] === undefined) {
      return;
    }
    if (e.target.type && e.target.type.toLowerCase() === "text") {
      if (
        !allowedShortcutsInText ||
        !allowedShortcutsInText.includes(loweredKey)
      ) {
        return;
      }
    } else {
      e.preventDefault();
    }
    const { callback, params } = this.props.mapKeyToCallback[loweredKey];
    if (params === undefined) {
      callback();
    } else {
      callback(params);
    }
  };

  componentDidMount() {
    window.addEventListener("keydown", this.keydownListener);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.keydownListener);
  }

  render() {
    return <></>;
  }
}

export { KeyboardShortcuts };
