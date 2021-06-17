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
    case "uploaded":
      buttonVariant = "warning";
      description = "The model is not deployed yet. Check back later.";
      break;
    case "processing":
      buttonVariant = "warning";
      description = "The model is in the process of deploying.";
      break;
    case "created":
      buttonVariant = "success";
      description =
        "The model can be evaluated on uploaded datasets, but it is not availiable for user interaction.";
      break;
    case "deployed":
      buttonVariant = "success";
      description = "You can interact with the model.";
      break;
    case "takendown":
      buttonVariant = "danger";
      description =
        "The model could not be evaluated on all of the datasets. The model could have bugs.";
      break;
    case "failed":
      buttonVariant = "danger";
      description = "The model could not be deployed.";
      break;
    default:
      buttonVariant = "warning";
      description = "The status of the model is unknown.";
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
