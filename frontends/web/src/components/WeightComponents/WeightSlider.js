/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Form } from "react-bootstrap";

/**
 * Weight Slider UI
 *
 * @param {number} weight current weight
 * @param {(number => void)} onWeightChange weight change handler
 */

export default function WeightSlider({ weight, onWeightChange }) {
  return (
    <Form className="d-flex ml-2 float-right">
      <Form.Control
        type="range"
        className="flex-grow-1"
        size="sm"
        min={0}
        max={5}
        value={weight}
        onInput={(event) => {
          onWeightChange(event.target.valueAsNumber);
        }}
      />
    </Form>
  );
}
