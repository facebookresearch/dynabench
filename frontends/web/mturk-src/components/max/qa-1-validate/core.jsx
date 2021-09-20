/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Container, Button, InputGroup } from "react-bootstrap";

import { ValidateInterface } from "./ValidateInterface.js";
import { ValidateInterfaceOnboarding } from "./ValidateInterfaceOnboarding.js";


class QAValidationTaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <h1>Validate Questions for Reading Comprehension</h1>
        <p>
          In this task, you will be asked to validate whether a span of
          text is the correct answer to a given question.
        </p>
      </>
    );
  }
}

class TaskInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <p>
          You will be shown a passage of text from Wikipedia, and a question.
          A candidate answer to the question is highlighted in the passage. 
          Please mark whether the answer is correct or not. If the selected answer is
          incorrect and the correct answer is not in the context, then flag this
          example.
        </p>
        <p>The possible validation options are:</p>
        <ul>
          <li><b>Valid</b> - The human answer is a correct answer, there is only one valid answer, and the AI answer is incorrect.</li>
          <li><b>Invalid: Bad Question</b> - You cannot understand the question, or it cannot be answered from the passage.</li>
          <li><b>Invalid: Bad Answer</b> - The human answer is incorrect.</li>
          <li><b>Invalid: AI Correct</b> - The human answer is correct, but the AI answer is also correct.</li>
          <li><b>Invalid: Multiple Valid Answers</b> - There isn't one answer which is clearly the best answer to the question, but there are multiple equally valid ones.</li>
          <li><b>Invalid: Yes/No Question</b> - The correct answer to the question should be "Yes" or "No".</li>
          <li><b>Invalid: Other</b> - Invalid for any other reason.</li>
          <li><b>Flag</b> - Flag this example as inappropriate.</li>
        </ul>
        <br />
      </>
    );
  }
}

class QAValidationTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showInstructions: true,
      showOnboardingSubmit: false,
      onboardingStep: 0,
      showNext: true,
    };
    this.showInstructions = this.showInstructions.bind(this);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.nextOnboarding = this.nextOnboarding.bind(this);
    this.showOnboardingSubmit = this.showOnboardingSubmit.bind(this);
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  nextOnboarding() {
    this.setState({ onboardingStep: this.state.onboardingStep + 1 });
    this.showOnboardingPrevious();
    if (this.state.onboardingStep == 9) {
      this.showOnboardingSubmit();
    }
  }
  completeOnboarding() {
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }
  showOnboardingSubmit() {
    this.setState({ showOnboardingSubmit: true, showNext: false });
  }
  
  render() {
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
        <ValidateInterfaceOnboarding step={this.state.onboardingStep} {...this.props} />
      </>
    );
  }
}

class QAValidationTaskMain extends React.Component {
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
        <ValidateInterface api={this.api} {...this.props} />
      </>
    );
  }
}

export {
  QAValidationTaskPreview,
  QAValidationTaskOnboarder,
  QAValidationTaskMain,
};
