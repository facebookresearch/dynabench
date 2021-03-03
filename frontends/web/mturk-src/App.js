/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";

import { useMephistoTask, getBlockedExplanation } from "mephisto-task";
import { TaskFrontend } from "./components/core.jsx";

import ApiService from "../src/common/ApiService.js";

function App() {
  const {
    taskConfig,
    providerWorkerId,
    mephistoWorkerId,
    agentId,
    assignmentId,

    initialTaskData,
    handleSubmit,
    isLoading,
    isPreview,
    isOnboarding,
    blockedReason,
  } = useMephistoTask();

  if (blockedReason !== null) {
    return <h1>{getBlockedExplanation(blockedReason)}</h1>;
  }

  const backend_host =
    taskConfig &&
    "provider_type" in taskConfig &&
    taskConfig["provider_type"] === "mturk"
      ? "https://api.dynabench.org"
      : process.env.REACT_APP_API_HOST;
  const api = new ApiService(backend_host);
  api.setMturkMode();

  if (isLoading) {
    return <h1>Loading</h1>;
  }

  return (
    <>
      <TaskFrontend
        initialTaskData={initialTaskData}
        taskConfig={taskConfig}
        onSubmit={handleSubmit}
        isOnboarding={isOnboarding}
        isPreview={isPreview}
        api={api}
        providerWorkerId={providerWorkerId}
        mephistoWorkerId={mephistoWorkerId}
        agentId={agentId}
        assignmentId={assignmentId}
      />
    </>
  );
}

export default App;
