/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";

import { CreateInterface } from '../../CreateInterface.js';
import { CreateInterfaceNoModel } from '../../CreateInterfaceNoModel.js';

class DivyanshNLITaskPreview extends React.Component {
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

class DivyanshNLITaskOnboarder extends React.Component {
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

class DivyanshNLITaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
  }
  render() {
    if (this.props.mephistoWorkerId % 2 == 0) {
    return <CreateInterface api={this.api} {...this.props} />;}
    else { return <CreateInterfaceNoModel api={this.api} {...this.props} />; }
  }
}

export { DivyanshNLITaskPreview, DivyanshNLITaskOnboarder, DivyanshNLITaskMain };
