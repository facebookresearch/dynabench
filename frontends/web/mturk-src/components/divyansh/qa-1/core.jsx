/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {Row, Container, Button } from 'react-bootstrap';

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

class TaskNoModelInstructions extends React.Component {
  render() {
    return <>
        <small>Instructions: In this task, you are provided with a passage (in grey). In the text field below that, please write a question and highlight the correct answer to that question in the passage, such that:</small>
        <br />
        <small>(1) the question is coherent, and </small>
        <br />
        <small>(2) another human being is able to correctly answer the question given this passage.</small>
        <br />
        <small>You will be able to submit HIT once you have written the question and selected an answer.</small>
        <small>Bonus will be provided to top 10% of the workers who generate questions that are correctly answered by other humans.</small>
        </>;
  }
}

class TaskModelInstructions extends React.Component {
  render() {
    return <>
        <small>Instructions: In this task, you are provided with a passage (in grey). In the text field below that, please write a question and highlight the correct answer to that question in the passage, such that:</small>
        <br />
	<small>(1) the question is coherent and another human being is able to correctly answer the question given this passage, </small>
        <br />
	<small>(2) an AI system running in the background is unable to correctly answer the question. </small>
        <br/>
        <small>The task will be complete if you either generate a question that fools the AI system, or you have generated 10 questions, none of which could fool the model.</small>
        <small>Bonus will be provided to top 10% of the workers who generate questions that fool the AI system but are still correctly answered by other humans.</small>
    </>;
  }
}

class DivyanshQATaskMain extends React.Component {
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
    if (this.props.mephistoWorkerId % 2 == 0) {
      return
	<>
          <Container>
          <Row>
          <Button className="btn" onClick={this.showInstructions}>{this.state.showInstructions ? "Hide" : "Show" } instructions </Button>
          </Row>
          {this.state.showInstructions && <Row> <TaskModelInstructions /> </Row>}
          </Container>
          <CreateInterface api={this.api} {...this.props} />
	</>;
    }
    else {
      return
	<>
          <Container>
          <Row>
          <Button className="btn" onClick={this.showInstructions}>{this.state.showInstructions ? "Hide" : "Show" } instructions </Button>
          </Row>
          {this.state.showInstructions && <Row> <TaskNoModelInstructions /> </Row>}
          </Container>
          <CreateInterfaceNoModel api={this.api} {...this.props} />
	</>;
    }
  }
}

export { DivyanshQATaskPreview, DivyanshQATaskOnboarder, DivyanshQATaskMain };
