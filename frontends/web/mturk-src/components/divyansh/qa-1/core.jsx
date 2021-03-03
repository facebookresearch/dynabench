/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Row, Container, Button, InputGroup } from "react-bootstrap";

import { CreateInterface } from "./CreateInterface.js";
import { CreateInterfaceNoModel } from "./CreateInterfaceNoModel.js";
import {
  CreateInterfaceOnboardingAns,
  CreateInterfaceOnboardingQues,
} from "./CreateInterfaceOnboarding.js";

class DivyanshQATaskPreview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <h1>Generate Questions for Reading Comprehension</h1>
        <p>
          In this task, you will be asked to generate Question-Answer pairs for
          reading comprehension tasks.
        </p>
      </>
    );
  }
}

class DivyanshQATaskOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.completeOnboarding = this.completeOnboarding.bind(this);
    this.state = {
      showOnboardingSubmit: false,
      onboardingStep: 0,
      showNext: true,
      showPrevious: false,
    };
    this.nextOnboarding = this.nextOnboarding.bind(this);
    this.showOnboardingSubmit = this.showOnboardingSubmit.bind(this);
    this.showOnboardingPrevious = this.showOnboardingPrevious.bind(this);
    this.previousOnboarding = this.previousOnboarding.bind(this);
  }
  nextOnboarding() {
    this.setState({ onboardingStep: this.state.onboardingStep + 1 });
    this.showOnboardingPrevious();
    if (this.state.onboardingStep == 10) {
      this.showOnboardingSubmit();
    }
  }
  previousOnboarding() {
    this.setState({
      onboardingStep: this.state.onboardingStep - 1,
      showOnboardingSubmit: false,
      showNext: true,
    });
  }
  completeOnboarding() {
    this.props.onSubmit({ success: true }); // if they failed, set to false
  }
  showOnboardingSubmit() {
    this.setState({ showOnboardingSubmit: true, showNext: false });
  }
  showOnboardingPrevious() {
    this.setState({ showPrevious: true });
  }

  render() {
    console.log(this.state);
    return (
      <>
        <Container>
          <Row>
            <h1>Onboarding</h1>
          </Row>
          {this.state.onboardingStep == 0 && (
            <Row>
              {" "}
              <TaskOnboardingInstructions />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 1 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 2 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 3 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 4 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 5 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingAns
                api={this.api}
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 6 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 7 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 8 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.onboardingStep == 9 && (
            <Row>
              {" "}
              <CreateInterfaceOnboardingQues
                step={this.state.onboardingStep}
                {...this.props}
              />{" "}
            </Row>
          )}
          {this.state.showOnboardingSubmit && (
            <Row>
              {" "}
              <TaskOnboardingCompletedInstructions />{" "}
            </Row>
          )}
          <Row>
            <InputGroup>
              {this.state.onboardingStep > 0 && (
                <>
                  <Button
                    className="btn btn-secondary"
                    onClick={this.previousOnboarding}
                  >
                    Back
                  </Button>{" "}
                  &nbsp; &nbsp;{" "}
                </>
              )}
              {this.state.showNext && (
                <Button
                  className="btn btn-primary"
                  onClick={this.nextOnboarding}
                >
                  Next
                </Button>
              )}
              {this.state.showOnboardingSubmit && (
                <Button
                  className="btn btn-primary btn-success"
                  onClick={this.completeOnboarding}
                >
                  Complete Onboarding
                </Button>
              )}
            </InputGroup>
          </Row>
        </Container>
      </>
    );
  }
}

class TaskOnboardingInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          {" "}
          <strong>Onboarding:</strong> During the onboarding phase, you will be
          able to familiarize yourself with the annotation platform.
          <br />
          <br />
          (1) <strong>First,</strong> we will show you a passage and five
          questions and ask you to highlight the right answer — a contiguous
          region within the passage.
          <br />
          <br />
          (2) <strong>Following that,</strong> you will be presented with a
          passage and four answers and you will be required to write one
          question for each highlighted answer.
          <br />
          <br />
          (3) <strong>In the last step,</strong> you will be provided with a
          passage and you will be required to:
          <ul>
            <li>
              <strong>write a question</strong> — whose answer is contained in
              the passage.
            </li>
            <li>
              <strong>highlight the answer</strong> — a contiguous region within
              the passage.
            </li>
          </ul>
          Additionally, when selecting an answer, please ensure that the
          selected answer is unambiguous — any competent reader shown the same
          question and passage should select the same (or highly overlapping)
          answer.
          <br />
          <br />
          <i>
            Submissions will be audited so do not try to cheat by writing
            incoherent questions or choosing incorrect answers.
          </i>
          <br />
          <br />
          <strong>
            Workers who successfully complete onboarding will be presented with
            the main task.
          </strong>{" "}
          This platform is <b>not compatible</b> with tablets or mobile phones.
        </small>
      </>
    );
  }
}

class TaskOnboardingCompletedInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <strong>Congrats on completing onboarding.</strong> We hope you are now
        familiar with the platform. Before you click on Complete Onboarding,
        here is some housekeeping.
        <ul>
          <li>
            <strong>
              The instructions for the downstream task are different than the
              onboarding.
            </strong>
          </li>
          <li>
            Please email us at NoahTurkProject.1041@gmail.com if you do not
            understand any parts of the instructions or if there is anything
            else that we can help with. We will try to respond as quickly as
            possible.
          </li>
          <li>
            If upon clicking Complete Onboarding, the interface does not
            re-route you to the main task, please refresh your page.
          </li>
        </ul>
        We appreciate your work and are eagerly looking forward to outputs from
        this HIT.
      </>
    );
  }
}

class TaskNoModelInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          {" "}
          <strong>Instructions:</strong> In this task, you are provided with a
          passage (in grey). In the text field below the passage, please:
          <ul>
            <li>
              <strong>write a question</strong> — whose answer is contained in
              the passage.
            </li>
            <li>
              <strong>highlight the answer</strong> — a contiguous region within
              the passage.
            </li>
          </ul>
          Additionally, please follow the following guidelines: (i) ensure that
          the question is coherent; (ii) that the answer is unambiguous — any
          competent reader shown the same question and passage should select the
          same (or highly overlapping) answer.
          <br />
          After entering your question and selecting the answer, press “Submit”.
          You are required to follow this process 5 times for each passage{" "}
          <b>(remember that each question is standalone)</b>. Once you've
          submitted all 5 question-answer pairs, Submit HIT button will appear.
          Try to write questions that do not highly overlap with passage text.
        </small>
        <br />
        <br />
        <small style={{ color: "red" }}>
          <i>
            Submissions will be audited for quality so do not try to write
            incoherent questions or choose incorrect answers.{" "}
          </i>
        </small>
        <small>
          <b>
            Please email us at NoahTurkProject.1041@gmail.com if you do not
            understand any parts of the instructions or if there is anything
            else that we can help with. We will try to respond as quickly as
            possible.
          </b>
        </small>
      </>
    );
  }
}

class TaskModelInstructions extends React.Component {
  render() {
    return (
      <>
        <br />
        <small>
          <strong>Instructions:</strong> Fool the machine! In this task, you are
          provided with a passage (in grey). In the text field below the
          passage, please:
          <ul>
            <li>
              <strong>write a question</strong> — whose answer is contained in
              the passage.
            </li>
            <li>
              <strong>highlight the answer</strong> — a contiguous region within
              the passage.
            </li>
          </ul>
          Be sure to (i) ensure that the question is coherent; (ii) that the
          answer is unambiguous — any competent reader shown the same question
          and passage should select the same (or highly overlapping) answer.
          <br />
          After entering your question and selecting the answer, press “Submit”.
          The app will then highlight the AI’s predicted answer. If the AI got
          it wrong, then you fooled the machine!
          <br />
          You are required to follow the above process 5 times for each passage{" "}
          <b>(remember that each question is standalone)</b>. Once you've
          submitted all 5 question-answer pairs, Submit HIT button will appear.
          You will be provided a bonus of 15 cents for every question that fools
          the machine! Try to write questions that do not highly overlap with
          passage text.
          <br />
          <br />
        </small>
        <small style={{ color: "red" }}>
          <i>
            Submissions will be audited for quality so do not try to write
            incoherent questions or choose incorrect answers.{" "}
          </i>
        </small>
        <small>
          <b>
            Please email us at NoahTurkProject.1041@gmail.com if you do not
            understand any parts of the instructions or if there is anything
            else that we can help with. We will try to respond as quickly as
            possible.
          </b>
        </small>
      </>
    );
  }
}

class DivyanshQATaskMain extends React.Component {
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
    if (this.props.mephistoWorkerId % 2 == 0) {
      return (
        <>
          <Container>
            <Row>
              <h2>Generate Questions for Reading Comprehension Tasks</h2> &nbsp;
              &nbsp;{" "}
              <Button className="btn" onClick={this.showInstructions}>
                {this.state.showInstructions ? "Hide" : "Show"} instructions{" "}
              </Button>
            </Row>
            {this.state.showInstructions && (
              <Row>
                {" "}
                <TaskModelInstructions />{" "}
              </Row>
            )}
          </Container>
          <CreateInterface api={this.api} {...this.props} />
        </>
      );
    } else {
      return (
        <>
          <Container>
            <Row>
              <h2>Generate Questions for Reading Comprehension Tasks</h2> &nbsp;
              &nbsp;{" "}
              <Button className="btn" onClick={this.showInstructions}>
                {this.state.showInstructions ? "Hide" : "Show"} instructions{" "}
              </Button>
            </Row>
            {this.state.showInstructions && (
              <Row>
                {" "}
                <TaskNoModelInstructions />{" "}
              </Row>
            )}
          </Container>
          <CreateInterfaceNoModel api={this.api} {...this.props} />
        </>
      );
    }
  }
}

export { DivyanshQATaskPreview, DivyanshQATaskOnboarder, DivyanshQATaskMain };
