import React from "react";

import { CreateInterface } from '../../CreateInterface.js';

class QATaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Adversarial Natural Language Inference</h1>
        <p>In this task, you will be asked to find examples that fool an AI model into making the wrong prediction.</p>
      </>;
  }
}

class QATaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
      <h1>Onboarding</h1>
      <p>Task onboarding</p>
      </>;
  }
}

class QATaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
  }
  render() {
    return <CreateInterface api={this.api} taskId={2} {...this.props} />;
  }
}

export { QATaskPreview, QATaskOnboarder, QATaskMain };
