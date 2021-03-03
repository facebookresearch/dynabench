/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { VQAOnboardingInstructions } from "./VQAOnboardingInstructions.js";
import { VQAExampleCards } from "./VQAExampleCards.js";
import { VQAQuiz } from "./VQAQuiz.js";
import { Container, Row, Col, Button, InputGroup } from "react-bootstrap";

class VQAOnboarder extends React.Component {
  constructor(props) {
    super(props);
    this.totalPhases = 3;
    this.state = {
      currPhase: 0,
      phasesCompleted: [true, false, false],
    };
  }

  nextPhase = () => {
    if (this.state.currPhase < this.totalPhases - 1) {
      this.setState((state) => {
        return { currPhase: state.currPhase + 1 };
      });
    }
  };

  prevPhase = () => {
    if (this.state.currPhase > 0) {
      this.setState((state) => {
        return { currPhase: state.currPhase - 1 };
      });
    }
  };

  setPhaseCompleted = () => {
    if (!this.state.phasesCompleted[this.state.currPhase]) {
      const updatedPhasesStatus = this.state.phasesCompleted;
      updatedPhasesStatus[this.state.currPhase] = true;
      this.setState({ phasesCompleted: updatedPhasesStatus });
    }
  };

  submitOnboarding = (status) => {
    this.props.onSubmit(status);
  };

  cacheQuizState = (quizState) => (this.cache = quizState);

  render() {
    const onboardingPhases = {
      0: (
        <VQAOnboardingInstructions onboardingMode={this.props.onboardingMode} />
      ),
      1: (
        <VQAExampleCards
          setPhaseCompleted={this.setPhaseCompleted}
          onboardingMode={this.props.onboardingMode}
        />
      ),
      2: (
        <VQAQuiz
          setPhaseCompleted={this.setPhaseCompleted}
          nextPhase={this.nextPhase}
          submitOnboarding={this.submitOnboarding}
          cacheQuizState={this.cacheQuizState}
          onboardingMode={this.props.onboardingMode}
          cache={this.cache}
          phaseCompleted={this.state.phasesCompleted[this.state.currPhase]}
        />
      ),
    };
    const phaseSelectionPanel = (
      <Row>
        <InputGroup className="my-5">
          {this.state.currPhase > 0 && (
            <Col className="d-flex justify-content-start">
              <Button className="btn btn-primary" onClick={this.prevPhase}>
                Previous Phase
              </Button>
            </Col>
          )}
          {this.state.phasesCompleted[this.state.currPhase] &&
            this.state.currPhase < this.totalPhases - 1 && (
              <Col className="d-flex justify-content-end">
                <Button className="btn btn-success" onClick={this.nextPhase}>
                  {this.state.currPhase === 0
                    ? "Start Onboarding"
                    : "Next Phase"}
                </Button>
              </Col>
            )}
        </InputGroup>
      </Row>
    );
    return (
      <Container className="px-0 my-2">
        {onboardingPhases[this.state.currPhase]}
        {phaseSelectionPanel}
      </Container>
    );
  }
}

export { VQAOnboarder };
