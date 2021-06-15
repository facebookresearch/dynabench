/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Badge, Modal } from "react-bootstrap";
import "./ModelStatus.css";
import { useState } from "react";

const DeploymentStatus = ({ deploymentStatus }) => {
  const [showModal, setShowModal] = useState(false);
  var buttonVariant;
  var description;
  switch (deploymentStatus) {
    case "deployed":
      buttonVariant = "success";
      description = "You can interact with the model.";
      break;
    case "takendown":
      buttonVariant = "danger";
      description = "An admin took the model down.";
      break;
    case "failed":
      buttonVariant = "danger";
      description =
        "The model could not be evaluated on all of the datasets. The model could have bugs.";
      break;
    default:
      buttonVariant = "warning";
      description = "The status of the model.";
  }
  return (
    <>
      <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
        <Modal.Header closeButton>
          <Modal.Title>{deploymentStatus}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{description}</Modal.Body>
      </Modal>
      <Badge
        variant={buttonVariant}
        className="modelStatus pointer"
        onClick={() => setShowModal(!showModal)}
      >
        {deploymentStatus}
      </Badge>
    </>
  );
};

export default DeploymentStatus;
