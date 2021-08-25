/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

const ChevronExpandButton = ({
  expanded,
  containerClassName,
  containerStyles,
}) => {
  return (
    <span
      type="button"
      className={containerClassName || ""}
      style={containerStyles || {}}
    >
      {expanded ? (
        <i className="fas fa-chevron-down" />
      ) : (
        <i className="fas fa-chevron-right" />
      )}
    </span>
  );
};
export default ChevronExpandButton;
