import React from 'react';
import './App.css';

import { useMephistoTask, getBlockedExplanation } from "mephisto-task";
import { TaskDescription, TaskFrontend } from "./components/core.jsx";

function App() {
  const {
    taskConfig,
    providerWorkerId,
    mephistoWorkerId,
    agentId,
    assignmentId,

    initialTaskData,
    handleSubmit,
    isPreview,
    previewHtml,
    isOnboarding,
    blockedReason,
  } = useMephistoTask();

  if (blockedReason !== null) {
    return <h1>{getBlockedExplanation(blockedReason)}</h1>;
  }
  if (taskConfig === null) {
    return <div>Initializing...</div>;
  }
  if (isPreview) {
    return <TaskDescription task_config={taskConfig} is_cover_page={true} />;
  }
  if (agentId === null) {
    return <div>Initializing...</div>;
  }
  if (initialTaskData === null) {
    return <h1>Gathering data...</h1>;
  }

  return (
    <>
      <TaskFrontend
        task_data={initialTaskData}
        task_config={taskConfig}
        onSubmit={handleSubmit}
        isOnboarding={isOnboarding}
      />
    </>
  );
}

export default App;
