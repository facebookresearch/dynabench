/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./DragAndDrop.css";

const DragAndDrop = (props) => {
  return (
    <>
      <div
        className="browse-wrap blue-color"
        style={{
          borderColor: props.required ? "red" : null,
          color: props.required ? "red" : null,
        }}
      >
        <div>Drag & drop your files here</div>
        <input
          type="file"
          name={props.name}
          className="upload"
          title="Choose a file to upload"
          onChange={props.handleChange}
        />
      </div>
    </>
  );
};
export default DragAndDrop;
