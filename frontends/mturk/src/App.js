import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';

import { useMephistoTask, getBlockedExplanation } from "mephisto-task";
import { TaskFrontend } from "./components/core.jsx";

import { ApiService } from './ApiService.js';

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

  let api = new ApiService();

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
      />
    </>
  );
}

export default App;
