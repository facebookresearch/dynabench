/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

const ExplainFeedback = ({ feedbackSaved, type }) => {
  const instruction =
    type === "explanation"
      ? "Click out of input box to save"
      : "Press enter to save or click the submit button";
  return (
    <span style={{ float: "right" }}>
      {feedbackSaved === null ? (
        <span style={{ color: "#b58c14" }}>Draft. {instruction}.</span>
      ) : feedbackSaved === false ? (
        "Saving..."
      ) : (
        <span style={{ color: "#085756" }}>Saved!</span>
      )}
    </span>
  );
};

export default ExplainFeedback;
