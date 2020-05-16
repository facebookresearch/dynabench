import React from 'react';
import './App.css';

import { useMephistoTask, getBlockedExplanation } from "mephisto-task";
import { TaskDescription, TaskFrontend } from "./components/core.jsx";

//import { ApiService } from './ApiService.js';
import { Hello } from './HelloWorld.js';

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
    return (
      <TaskDescription
        task_config={taskConfig}
        is_cover_page={true}
      />);
  }
  if (agentId === null) {
    return <div>Initializing...</div>;
  }
  if (initialTaskData === null) {
    return <h1>Gathering data...</h1>;
  }

  h = new Hello();
  console.log(h.hello);

  //api = new ApiService();
  //console.log(api);

  return (
    <>
      <TaskFrontend
        task_data={initialTaskData}
        task_config={taskConfig}
        onSubmit={handleSubmit}
        isOnboarding={isOnboarding}
        hello={h}
      />
    </>
  );
}

export default App;
