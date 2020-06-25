import React from "react";

import { CreateInterface } from '../../CreateInterface.js';

class NLITaskPreview extends React.Component {
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

class NLITaskOnboarder extends React.Component {
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

class NLITaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    console.log(props);
  }
  render() {
    return <CreateInterface api={this.api} taskId={1} {...this.props} />;
  }
}

export { NLITaskPreview, NLITaskOnboarder, NLITaskMain };
