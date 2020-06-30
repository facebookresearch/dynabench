import React from "react";

import { CreateInterface } from '../../CreateInterface.js';
import { CreateInterfaceNoModel } from '../../CreateInterfaceNoModel.js';

class DivyanshQATaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Adversarial Question Answering</h1>
        <p>In this task, you will be asked to find examples that fool an AI model into making the wrong prediction.</p>
      </>;
  }
}

class DivyanshQATaskOnboarder extends React.Component {
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

class DivyanshQATaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
  }
  render() {
    if (this.props.mephistoWorkerId % 2 == 0) {
      return <CreateInterface api={this.api} taskId={7} {...this.props} />;}
    else {return <CreateInterfaceNoModel api={this.api} taskId={7} {...this.props} />;}
  }
}

export { DivyanshQATaskPreview, DivyanshQATaskOnboarder, DivyanshQATaskMain };
