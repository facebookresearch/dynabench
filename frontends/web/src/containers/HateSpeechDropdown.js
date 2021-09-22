/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { DropdownButton, Dropdown } from "react-bootstrap";

const HateSpeechDropdown = ({ hateType, dataIndex, onClick }) => {
  return (
    <DropdownButton
      variant="light"
      size="sm"
      className="p-1"
      title={hateType ? "Type of hate: " + hateType : "Type of hate"}
    >
      {[
        "Threatening language",
        "Supporting hateful entities",
        "Derogation",
        "Dehumanizing language",
        "Animosity",
        "None selected",
      ].map((type, index) => (
        <Dropdown.Item
          data-index={dataIndex}
          data={type}
          onClick={onClick}
          key={index}
          index={index}
        >
          {type}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export { HateSpeechDropdown };
