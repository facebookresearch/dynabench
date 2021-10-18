/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./WeightIndicator.css";

/**
 * Renders a stacking UI to represent the weight of a metric or dataset.
 *
 * @param {number} props.weight the weight to render
 */
export default function WeightIndicator({ weight }) {
  return (
    <svg width={10} height={12}>
      {[...Array(weight)].map((x, i) => (
        <rect
          key={"" + i}
          width="10"
          height="1"
          x={0}
          y={10 - i * 2}
          className="weight-indicator"
        />
      ))}
    </svg>
  );
}
