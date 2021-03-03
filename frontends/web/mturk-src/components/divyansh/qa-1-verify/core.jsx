/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Container, Button } from "react-bootstrap";

import { VerifyInterface } from "./VerifyInterfaceQA.js";
class DivyanshVerifyQATaskPreview extends React.Component {
  render() {
    return (
      <>
        <h1>Generate Questions for Reading Comprehension</h1>
        <p>
          In this task, you will be asked to verify whether a phrase correctly
          answers a Question.
        </p>
      </>
    );
  }
}

class DivyanshVerifyQATaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
  }
}

class TaskInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          Below, you are shown a question, and a passage of text. A candidate
          answer to the question is highlighted in the passage. Please mark
          whether it is the correct answer or not. If the selected answer is
          incorrect and the correct answer is not in the context, then flag this
          example.
        </small>
        <br />
      </>
    );
  }
}

class DivyanshVerifyQATaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = { showInstructions: true };
    this.showInstructions = this.showInstructions.bind(this);
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  render() {
    console.log(this.props);
    return (
      <>
        <Container>
          <Row>
            <h2>Does the highlighted span correctly answer the question?</h2>{" "}
            &nbsp; &nbsp;{" "}
            <Button className="btn" onClick={this.showInstructions}>
              {this.state.showInstructions ? "Hide" : "Show"} instructions{" "}
            </Button>
          </Row>
          {this.state.showInstructions && (
            <Row>
              {" "}
              <TaskInstructions />{" "}
            </Row>
          )}
          <br />
        </Container>
        <VerifyInterface api={this.api} {...this.props} />
      </>
    );
  }
}

export {
  DivyanshVerifyQATaskPreview,
  DivyanshVerifyQATaskOnboarder,
  DivyanshVerifyQATaskMain,
};
