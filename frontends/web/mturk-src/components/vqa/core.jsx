/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { VQAOnboardingInstructions } from "./VQAOnboardingInstructions.js";
import { VQAExampleCards } from "./VQAExampleCards.js";
import { VQAQuiz } from "./VQAQuiz.js";
import { CreateVQAMturkInterface } from "./CreateVQAMturkInterface.js";
import { Container, Row, Col, Button, InputGroup } from "react-bootstrap";
import { SimulationExamples } from "./OnboardingInfo/VQASimulationExamples.js";
import { VQAQuizExamples } from "./OnboardingInfo/VQAQuizExamples.js"

class VQATaskPreview extends React.Component {
    render() {
        return (
            <div style={{ width: "100%", height: "100%", backgroundColor: "white" }}>
                <div className="mx-5 my-3">
                    <h1>Ask Questions About Images That Fool An AI</h1>
                    <p>
                        In this task,  you will be asked to find questions about an image that fool an AI model
                        into answering incorrectly. The AI is reasonably good at understanding English and interpreting images.
                    </p>
                    <p>
                        Given an <b>image</b> that you will use as context, you are expected to
                        do the following:
                    </p>
                    <ol className="mx-5">
                        <li>
                            Write an <b>question</b> based on the image that you think the AI
                            would get <b>wrong</b> but another person would get <b>right</b>.
                        </li>
                        <li>
                            Verify AI's answer:
                            <ul className="mx-3" style={{ listStyleType: "disc" }}>
                                <li>
                                    If the AI's answer was correct, select the
                                    <b style={{ color: "green" }}> Correct</b> button.
                                </li>
                                <li>
                                    If the AI's answer was incorrect, that is, the AI was successfully fooled,
                                    select the <b style={{ color: "red" }}> Incorrect</b> button
                                    and <b>provide the correct answer   </b> for your question.
                                </li>
                            </ul>
                        </li>
                    </ol>
                    <p>
                        Sometimes AI might be tricky to fool. When you have spent 3
                        tries without success you will be able to skip to the next image by
                        clicking <b style={{ color: "blue" }}>Switch Image</b>.
                    </p>
                    <h3>Completion</h3>
                    <p>
                        The HIT is completed if you successfully <b>fool the model</b> or if you reach <b>10 tries</b>.
                        Any of those events unlock the <b>Submit HIT</b> button, once you click it you will be taken
                        to the next HIT. However you can keep trying to fool the model and get the bonus after
                        the 10 tries are reached.
                    </p>
                    <h3>Reward</h3>
                    <p>
                        On completing the task you will receive $0.3. If you fooled the model
                        and other people agree with your answer you will receive a bonus of $x.
                    </p>
                    <h3><strong style={{ color: "red" }}>WARNING:</strong></h3>
                    <p>
                        Every successful question will
                        be checked by other humans. If it is detected that you are spamming the AI or making
                        a bad use of the interface you might be flagged or even blocked.
                    </p>
                    <p>
                        The AI utilizes the latest technologies to understand language and can be very smart. Be creative to fool the AI - it will be fun!!!
                    </p>
                </div>
            </div>
        )
    }
}

const VQAOnboarderPhases = {
    0: VQAOnboardingInstructions,
    1: VQAExampleCards,
    2: VQAQuiz,
    3: CreateVQAMturkInterface,
}

class VQATaskOnboarder extends React.Component {

    constructor() {
        super();
        this.simulationExamples = SimulationExamples;
        this.totalPhases = 4;
        this.state = {
            currPhase: 0,
            phasesCompleted: [true, false, false, false],
        };
    }

    getRandomContext = () => {
        const randIdx = Math.floor(Math.random() * this.simulationExamples.length);
        return this.simulationExamples[randIdx];
    }

    nextPhase = () => {
        if (this.state.currPhase < this.totalPhases - 1) {
            this.setState(state => {
                return { currPhase: state.currPhase + 1 };
            });
        }
    }

    prevPhase = () => {
        if (this.state.currPhase > 0) {
            this.setState(state => {
                return { currPhase: state.currPhase - 1 };
            });
        }
    }

    setPhaseCompleted = () => {
        if (!this.state.phasesCompleted[this.state.currPhase]) {
            let updatedPhasesStatus = this.state.phasesCompleted;
            updatedPhasesStatus[this.state.currPhase] = true;
            this.setState({ phasesCompleted: updatedPhasesStatus });
        }
    }

    submitOnboarding = (status) => {
        this.props.onSubmit(status)
    }

    cacheQuizState = quizState => this.cache = quizState;

    render() {
        const onboardingPhases = {
            0: <VQAOnboardingInstructions/>,
            1: <VQAExampleCards setPhaseCompleted={this.setPhaseCompleted}/>,
            2: <VQAQuiz
                    setPhaseCompleted={this.setPhaseCompleted}
                    nextPhase={this.nextPhase}
                    submitOnboarding={this.submitOnboarding}
                    cacheQuizState={this.cacheQuizState}
                    cache={this.cache}
                    phaseCompleted={this.state.phasesCompleted[this.state.currPhase]}
                />,
            3: <CreateVQAMturkInterface
                {...this.props}
                getRandomContext={this.getRandomContext}
                mode="onboarding"
            />
        }
        const phaseSelectionPanel = (
            <Row>
                <InputGroup className="my-5">
                    {this.state.currPhase > 0 &&
                        <Col className="d-flex justify-content-start">
                            <Button className="btn btn-primary" onClick={this.prevPhase}>Previous Phase</Button>
                        </Col>
                    }
                    {this.state.phasesCompleted[this.state.currPhase] &&
                        <Col className="d-flex justify-content-end">
                            <Button className="btn btn-success" onClick={this.nextPhase}>
                                {this.state.currPhase === 0 ? "Start Onboarding" : "Next Phase"}
                            </Button>
                        </Col>
                    }
                </InputGroup>
            </Row>
        )
        return <Container className="px-0 my-2">
            {onboardingPhases[this.state.currPhase]}
            {phaseSelectionPanel}
        </Container>
    }
}

class VQATaskMain extends React.Component {
    render() {
        return <CreateVQAMturkInterface
            {...this.props}
            mode="main"
        />
    }
}

export { VQATaskPreview, VQATaskOnboarder, VQATaskMain };
