/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

const FloresTaskDescription = ({ taskName, taskDesc }) => {
  return (
    <>
      <h5>{taskName}</h5>
      <p>
        <span className="font-weight-bold">Description: </span> {taskDesc}
      </p>
    </>
  );
};

export default FloresTaskDescription;
