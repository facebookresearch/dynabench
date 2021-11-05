/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Badge, Modal } from "react-bootstrap";
import "./ModelStatus.css";
import { useState } from "react";

const EvaluationStatus = ({ evaluationStatus }) => {
  const [showModal, setShowModal] = useState(false);
  var buttonVariant;
  var description;
  switch (evaluationStatus) {
    case "completed":
      buttonVariant = "success";
      description = "Metrics have been computed from the model's predictions.";
      break;
    case "evaluating":
      buttonVariant = "warning";
      description =
        "The server is computing metrics from the model's predictions.";
      break;
    case "pre_evaluation":
      buttonVariant = "warning";
      description =
        "The server has not started computing metrics from the model's predictions.";
      break;
    case "failed":
      buttonVariant = "danger";
      description = "Metrics could not be computed on one or more datasets.";
      break;
    default:
      buttonVariant = "warning";
      description = "The evaluation status of the model is unknown.";
  }
  return (
    <>
      <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
        <Modal.Header closeButton>
          <Modal.Title>{evaluationStatus}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{description}</Modal.Body>
      </Modal>
      <Badge
        variant={buttonVariant}
        className="modelStatus pointer"
        onClick={() => setShowModal(!showModal)}
      >
        {evaluationStatus}
      </Badge>
    </>
  );
};

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
    case "predictions_upload":
      buttonVariant = "success";
      description = "Only the model's predictions were uploaded.";
      break;
    case "takendown":
      buttonVariant = "danger";
      description =
        "The model could not return predictions on all of the datasets. The model could have bugs.";
      break;
    case "takendownnonactive":
      buttonVariant = "danger";
      description =
        "The model was taken down due to inactivity. Press `Deploy Model` to deploy the model";
      break;
    case "failed":
      buttonVariant = "danger";
      description = "The model could not be deployed.";
      break;
    default:
      buttonVariant = "warning";
      description = "The deployment status of the model is unknown.";
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

const AnonymousStatus = ({ anonymousStatus }) => {
  const [showModal, setShowModal] = useState(false);
  var buttonText;
  var buttonVariant;
  var description;
  switch (anonymousStatus) {
    case true:
      buttonText = "anonymous";
      buttonVariant = "dark";
      description =
        "Identity of model owner is anonymised when model is published.";
      break;
    case false:
      buttonText = "identity public";
      buttonVariant = "light";
      description =
        "Identity of model owner is public when model is published.";
      break;
    default:
      buttonText = "Unknown";
      buttonVariant = "warning";
      description = "The owner anonymity of the model is unknown.";
  }
  return (
    <>
      <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
        <Modal.Header closeButton>
          <Modal.Title>{buttonText}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{description}</Modal.Body>
      </Modal>
      <Badge
        variant={buttonVariant}
        className="modelStatus pointer"
        onClick={() => setShowModal(!showModal)}
      >
        {buttonText}
      </Badge>
    </>
  );
};

export { DeploymentStatus, EvaluationStatus, AnonymousStatus };
