/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {Row, Container, Button, InputGroup } from 'react-bootstrap';

import { VerifyInterface } from './VerifyInterface.js';
class DivyanshVerifyQATaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <>
        <h1>Generate Questions for Reading Comprehension</h1>
        <p>In this task, you will be asked to generate Question-Answer pairs for reading comprehension tasks.</p>
      </>;
  }
}

class DivyanshVerifyQATaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
  }
}

class TaskInstructions extends React.Component {
  render() {
    return <>
        <br />
	<small>You are provided a question, the answer to which lies in the passage. A candidate answer is also presented to you below. Please select whether the candidate answer is <i>Correct</i> or <i>Incorrect</i>.</small>
	<br />
	</>;
  }
}

class DivyanshVerifyQATaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {showInstructions:true};
    this.showInstructions = this.showInstructions.bind(this);
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  render() {
    console.log(this.props);
    return <>
        <Container>
        <Row>
        <h2>Generate Questions for Reading Comprehension Tasks</h2> &nbsp; &nbsp; <Button className="btn" onClick={this.showInstructions}>{this.state.showInstructions ? "Hide" : "Show" } instructions </Button>
        </Row>
	{this.state.showInstructions && <Row> <TaskInstructions /> </Row>}
        </Container>
        <VerifyInterface api={this.api} {...this.props} />
	</>;
  }
}

export { DivyanshVerifyQATaskPreview, DivyanshVerifyQATaskOnboarder, DivyanshVerifyQATaskMain };
