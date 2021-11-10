/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import {
  DivyanshNLITaskPreview,
  DivyanshNLITaskOnboarder,
  DivyanshNLITaskMain,
} from "./divyansh/nli-1/core.jsx";
import {
  DivyanshQATaskPreview,
  DivyanshQATaskOnboarder,
  DivyanshQATaskMain,
} from "./divyansh/qa-1/core.jsx";
import {
  NLITaskPreview,
  NLITaskOnboarder,
  NLITaskMain,
} from "./nli-1/core.jsx";
import {
  WinogroundTaskPreview,
  WinogroundTaskOnboarder,
  WinogroundTaskMain,
} from "./winoground/core.jsx";
import {
  DivyanshVerifyQATaskPreview,
  DivyanshVerifyQATaskOnboarder,
  DivyanshVerifyQATaskMain,
} from "./divyansh/qa-1-verify/core.jsx";
import {
  SentimentTaskPreview,
  SentimentTaskOnboarder,
  SentimentTaskMain,
} from "./sa-zen/core.jsx";
import {
  NLIR4TaskPreview,
  NLIR4TaskOnboarder,
  NLIR4TaskMain,
} from "./yixin/nli-4-mtuk/core.jsx";

const TaskComponents = {
  "divyansh-nli-1": [
    DivyanshNLITaskPreview,
    DivyanshNLITaskOnboarder,
    DivyanshNLITaskMain,
  ],
  "divyansh-qa-1": [
    DivyanshQATaskPreview,
    DivyanshQATaskOnboarder,
    DivyanshQATaskMain,
  ],
  "divyansh-qa-1-verify": [
    DivyanshVerifyQATaskPreview,
    DivyanshVerifyQATaskOnboarder,
    DivyanshVerifyQATaskMain,
  ],
  "nli-1": [NLITaskPreview, NLITaskOnboarder, NLITaskMain],
  "winoground": [WinogroundTaskPreview, WinogroundTaskOnboarder, WinogroundTaskMain],
  "nli-4-mturk": [NLIR4TaskPreview, NLIR4TaskOnboarder, NLIR4TaskMain],
  "sa-zen": [SentimentTaskPreview, SentimentTaskOnboarder, SentimentTaskMain],
  // TODO: New tasks are added here
};

class TaskFrontend extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    if (props.taskConfig.task_name) {
      this.task = props.taskConfig.task_name;
      if (!this.task in TaskComponents) {
        throw "Unknown task ID specified";
      }
    } else {
      throw "No task ID specified";
    }
  }

  render() {
    const [TaskPreview, TaskOnboarder, TaskMain] = TaskComponents[this.task];
    if (this.props.isPreview) {
      return <TaskPreview {...this.props} />;
    } else if (this.props.isOnboarding) {
      return <TaskOnboarder {...this.props} />;
    } else {
      return <TaskMain {...this.props} />;
    }
  }
}

export { TaskFrontend };
