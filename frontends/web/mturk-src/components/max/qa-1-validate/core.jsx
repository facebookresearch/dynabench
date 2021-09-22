/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Col, Container, Button, InputGroup } from "react-bootstrap";

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
          text is the correct answer to a given question, and, in some cases,
          whether an AI has succeeded in correctly answering the question or not.
          You will be asked to validate 10 examples.
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
          A human's answer to the question is highlighted in the passage. 
          An AI answer will also be shown in some cases.
          Please validate whether the answer is correct or not. If there is an AI 
          answer, it has to be incorrect for the example to be valid.
        </p>
        <p>The possible validation options are:</p>
        <ul>
          <li><b>Valid</b> - The human answer is a correct answer, there is only one valid answer, and the AI answer is incorrect.</li>
          <li><b>Invalid: Bad Question</b> - You cannot understand the question, or it cannot be answered from the passage.</li>
          <li><b>Invalid: Bad Human Answer</b> - The human answer is incorrect.</li>
          <li><b>Invalid: AI Correct</b> - The human answer is correct, but the AI answer is also correct.</li>
          <li><b>Invalid: Multiple Valid Answers</b> - There isn't one answer which is clearly the best answer to the question, but there are multiple equally valid ones.</li>
          <li><b>Invalid: Other</b> - Invalid for any other reason.</li>
          <li><b>Flag</b> - Flag this example as inappropriate.</li>
        </ul>
        <br />

        <hr />

          <small>
            <p className="block-text">
              By answering the following questions, you are participating in a
              research study. If you have any questions or require further
              clarification of the instructions, please contact us at{" "}
              <a href="mailto:NoahTurkProject.1032@gmail.com" target="_blank">
                NoahTurkProject.1032@gmail.com
              </a>
              . You must be at least 18 years old to participate. Your
              participation in this research is voluntary. You may decline to
              answer any or all of the following questions. You may decline
              further participation, at any time, without adverse consequences.
              Your anonymity is assured; the researchers who have requested your
              participation will not receive any personal information about you.
            </p>
          </small>
      </>
    );
  }
}

class QAValidationTaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showInstructions: false,
      showOnboardingSubmit: false,
      onboardingStep: 0,
      showNext: false,
    };
    this.showInstructions = this.showInstructions.bind(this);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.nextOnboarding = this.nextOnboarding.bind(this);
    this.showOnboardingNext = this.showOnboardingNext.bind(this);
    this.showOnboardingSubmit = this.showOnboardingSubmit.bind(this);
  }
  showInstructions() {
    this.setState({ showInstructions: !this.state.showInstructions });
  }
  nextOnboarding() {
    this.setState({ onboardingStep: this.state.onboardingStep + 1, showNext: false });
  }
  completeOnboarding() {
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }
  showOnboardingNext() {
    if (this.state.onboardingStep >= 5) {
      this.showOnboardingSubmit();
    } else {
      this.setState({ showNext: true });
    }
  }
  showOnboardingSubmit() {
    this.setState({ showOnboardingSubmit: true, showNext: false });
  }
  
  render() {
    return (
      <>
        <Container>
          <Row>
            <h2>Validate QA Examples</h2>{" "}
            &nbsp; &nbsp;{" "}
            {this.state.onboardingStep > 0 && (
              <Button className="btn" onClick={this.showInstructions}>
                {this.state.showInstructions ? "Hide" : "Show"} instructions{" "}
              </Button>
            )}
          </Row>
          {this.state.showInstructions && (
            <Row>
              <Col lg={12}>
                <TaskInstructions />{" "}
              </Col>
            </Row>
          )}
          <br />
        </Container>

        {this.state.onboardingStep == 0 && (
          <Container>
            <Row>
              <Col lg={12}>
                <TaskInstructions />{" "}
              </Col>
              <Button
                className="btn btn-primary mt-3"
                onClick={this.nextOnboarding}
              >
                Get Started
              </Button>
            </Row>
         </Container>
        )}
        {this.state.onboardingStep == 1 && (
          <ValidateInterfaceOnboarding step={this.state.onboardingStep - 1} showOnboardingNext={this.showOnboardingNext} {...this.props} />
        )}
        {this.state.onboardingStep == 2 && (
          <ValidateInterfaceOnboarding step={this.state.onboardingStep - 1} showOnboardingNext={this.showOnboardingNext} {...this.props} />
        )}
        {this.state.onboardingStep == 3 && (
          <ValidateInterfaceOnboarding step={this.state.onboardingStep - 1} showOnboardingNext={this.showOnboardingNext} {...this.props} />
        )}
        {this.state.onboardingStep == 4 && (
          <ValidateInterfaceOnboarding step={this.state.onboardingStep - 1} showOnboardingNext={this.showOnboardingNext} {...this.props} />
        )}
        {this.state.onboardingStep == 5 && (
          <ValidateInterfaceOnboarding step={this.state.onboardingStep - 1} showOnboardingNext={this.showOnboardingNext} {...this.props} />
        )}

        <Container className="pb-4">
          <Row>
            <InputGroup className="px-5">
              {this.state.showNext && (
                <Button
                  className="btn btn-primary mt-2 mr-2"
                  onClick={this.nextOnboarding}
                >
                  Next Example
                </Button>
              )}
              {this.state.showOnboardingSubmit && (
                <Col lg={12} className="mt-3">
                  <p><b>Congratulations</b>, you have successfully completed onboarding! Please click the button below to proceed to the main task.</p>
                  <Button
                    className="btn btn-primary btn-success mt-2"
                    onClick={this.completeOnboarding}
                  >
                    Complete Onboarding
                  </Button>
                </Col>
              )}
            </InputGroup>
          </Row>
        </Container>
      </>
    );
  }
}

class QAValidationTaskMain extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = { showInstructions: false };
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
            <h2>Validate QA Examples</h2>{" "}
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
