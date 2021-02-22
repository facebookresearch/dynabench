/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import AtomicImage from "../../../../src/containers/AtomicImage.js";
import WarningMessage from "./WarningMessage.js"
import { ExampleValidationActions } from "../../../../src/containers/ExampleValidationActions.js";
import { KeyboardShortcuts } from "../../../../src/containers/KeyboardShortcuts.js"
import { ValidQuestionCharacteristics } from "./QuestionsCharacteristics.js"
import {
    Container,
    Row,
    Col,
    Card,
    InputGroup,
    Button,
} from "react-bootstrap";

class VQAValidationInterface extends React.Component {

    constructor(props) {
        super(props);
        this.api = props.api;
        this.vqaTaskId = 12;
        this.batchAmount = 10;
        this.userMode = "user";
        this.interfaceMode = "mturk";
        this.VALIDATION_STATES = {
            "CORRECT": 0,
            "INCORRECT": 1,
            "FLAGGED": 2,
            "UNKNOWN": 3,
        }
        this.state = {
            questionValidationState: this.VALIDATION_STATES.UNKNOWN,
            responseValidationState: this.VALIDATION_STATES.UNKNOWN,
            flagReason: null,
            taskId: props.taskConfig.task_id,
            showInstructions: false,
            examplesOverError: false,
            submitDisabled: false,
            totalValidationsSoFar: 0,
            task: {},
        }
    }

    componentDidMount() {
        this.api.getTask(this.state.taskId)
        .then((result) => {
            this.setState({ task: result }, () => {
                this.state.task.selected_round = this.state.task.cur_round;
                this.getNewExample();
            });
        }, (error) => {
            console.log(error);
        });
    }

    setQuestionValidationState = (valState) => {
        this.setState({
            questionValidationState: valState,
            responseValidationState: this.VALIDATION_STATES.UNKNOWN,
            flagReason: null
        })
    }

    setResponseValidationState = (valState) => {
        this.setState({ responseValidationState: valState })
    }

    getNewExample = () => {
        this.api.getRandomExample(this.vqaTaskId, this.state.task.selected_round)
        .then((result) => {
            this.setState({
                example: result,
                examplesOverError: false,
                submitDisabled: false,
                questionValidationState: this.VALIDATION_STATES.UNKNOWN,
                responseValidationState: this.VALIDATION_STATES.UNKNOWN,
                flagReason: null,
            });
        }, (error) => {
            console.log(error);
            this.setState({ examplesOverError: true });
        });
    }

    submitValidation = () => {
        if (this.state.submitDisabled) { return; }
        if ((this.state.questionValidationState === this.VALIDATION_STATES.UNKNOWN) ||
            (this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && this.state.responseValidationState === this.VALIDATION_STATES.UNKNOWN)) {
                return;
        }
        let action = null;
        if (this.state.questionValidationState === this.VALIDATION_STATES.FLAGGED) {
            action = "flagged"
        } else if (this.state.questionValidationState === this.VALIDATION_STATES.INCORRECT || this.state.responseValidationState === this.VALIDATION_STATES.INCORRECT) {
            action = "incorrect"
        } else if (this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && this.state.responseValidationState === this.VALIDATION_STATES.CORRECT) {
            action = "correct"
        }
        const metadata = {
            annotator_id: this.props.providerWorkerId,
        }
        this.setState({ submitDisabled: true }, () => {
            this.api.validateExample(this.state.example.id, action, this.userMode, metadata, this.props.providerWorkerId)
            .then(result => {
                this.setState({
                    totalValidationsSoFar: this.state.totalValidationsSoFar + 1,
                }, () => {
                    if (this.state.totalValidationsSoFar === this.batchAmount) {
                        this.props.onSubmit(this.state);
                    } else {
                        this.getNewExample();
                    }
                })
            }), (error) => {
                console.log(error);
            }
        })
    }

    render() {
        const validationInstructions = this.state.showInstructions ? (
            <>
                <p>
                    You will be shown an image and a question. The task consists of two rounds.
                    First, you have to determine if the question is <b className="dark-blue-color">valid</b>.
                </p>
                <p>A question is considered <b>valid</b> if:</p>
                <ValidQuestionCharacteristics/>
                <p>
                    After validating the question, next you will determine whether the provided answer is <b className="dark-blue-color">correct</b>.
                    If you think the example should be reviewed, please click the <b>Flag</b> button and explain why
                    you flagged the example (try to use this sparingly).
                </p>
                <p>You can also use the key shortcuts to operate:</p>
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                    <li><b>Arrow Up:</b> Valid Question.</li>
                    <li><b>Arrow Down:</b> Invalid Question.</li>
                    <li><b>f:</b> Flag Question.</li>
                    <li><b>Arrow Right:</b> Correct Answer.</li>
                    <li><b>Arrow Left:</b> Incorrect Answer.</li>
                    <li><b>s:</b> Show Instructions.</li>
                    <li><b>h:</b> Hide Instructions.</li>
                    <li><b>Escape:</b> Clear Selections.</li>
                    <li> <b>Enter:</b> Submit Validation.</li>
                </ul>
            </>
        ): (
            <></>
        )

        let taskInstructionsButton = <></>
        if (this.state.showInstructions) {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: false })}}>Hide Instructions</Button>
        } else {
            taskInstructionsButton = <Button className="btn btn-info mb-3" onClick={() => {this.setState({ showInstructions: true })}}>Show Instructions</Button>
        }
        const taskTracker = <small style={{ padding: 7 }}>{`Validations: ${this.state.totalValidationsSoFar} / ${this.batchAmount}.`}</small>;
        return (
            <Container>
                <h4>Validate Examples</h4>
                {taskInstructionsButton}
                <WarningMessage/>
                {validationInstructions}
                <Row>
                    <Card style={{ width: '100%'}}>
                        {!this.state.examplesOverError ? (
                            this.state.example ? (
                                <>
                                    <Card.Body className="d-flex justify-content-center pt-2" style={{ height: "auto" }}>
                                        <AtomicImage src={this.state.example.context.context} maxHeight={600} maxWidth={900}/>
                                    </Card.Body>
                                    <Card className="hypothesis rounded border m-3 card">
                                        <Card.Body className="p-3">
                                            <Row>
                                                <Col xs={12} md={7}>
                                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                                        Is the question below valid? (Please see instructions on the top to see what we mean by "valid". Warning: if you do not follow the instructions, you will be banned.)
                                                    </h6>
                                                    <p>
                                                        {this.state.example.text}
                                                    </p>
                                                    <ExampleValidationActions
                                                        correctSelected={this.state.questionValidationState === this.VALIDATION_STATES.CORRECT}
                                                        incorrectSelected={this.state.questionValidationState === this.VALIDATION_STATES.INCORRECT}
                                                        flaggedSelected={this.state.questionValidationState === this.VALIDATION_STATES.FLAGGED}
                                                        userMode={this.userMode}
                                                        interfaceMode={this.interfaceMode}
                                                        isQuestion={true}
                                                        isFlaggingAllowed={true}
                                                        setCorrectSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.CORRECT, flagReason: null })}
                                                        setIncorrectSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.INCORRECT, flagReason: null })}
                                                        setFlagSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.FLAGGED })}
                                                        setFlagReason={flagReason => this.setState({ flagReason })}
                                                    />
                                                    {this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && (
                                                        <div className="mt-3">
                                                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                                                Determine if the answer is correct:
                                                            </h6>
                                                            <p>
                                                                {this.state.example.model_preds.split("|")[0]}
                                                            </p>
                                                            <ExampleValidationActions
                                                                correctSelected={this.state.responseValidationState === this.VALIDATION_STATES.CORRECT}
                                                                incorrectSelected={this.state.responseValidationState === this.VALIDATION_STATES.INCORRECT}
                                                                flaggedSelected={this.state.responseValidationState === this.VALIDATION_STATES.FLAGGED}
                                                                userMode={this.userMode}
                                                                interfaceMode={this.interfaceMode}
                                                                isQuestion={false}
                                                                isFlaggingAllowed={false}
                                                                setCorrectSelected={() => this.setState({ responseValidationState: this.VALIDATION_STATES.CORRECT, flagReason: null })}
                                                                setIncorrectSelected={() => this.setState({ responseValidationState: this.VALIDATION_STATES.INCORRECT, flagReason: null })}
                                                                setFlagSelected={() => this.setState({ responseValidationState: this.VALIDATION_STATES.FLAGGED })}
                                                                setFlagReason={flagReason => this.setState({ flagReason })}
                                                            />
                                                        </div>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                        <Card.Footer>
                                            <InputGroup className="align-items-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    disabled={this.state.submitDisabled}
                                                    onClick={this.submitValidation}>
                                                    Submit
                                                </button>
                                                {taskTracker}
                                            </InputGroup>
                                        </Card.Footer>
                                    </Card>
                                </>
                            ) : (
                                <Card.Body className="p-3">
                                    <Row>
                                        <Col xs={12} md={7}>
                                            <p>Loading Examples...</p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            )
                        ) : (
                            <Card.Body className="p-3">
                                <Row>
                                    <Col xs={12} md={7}>
                                        <p>No more examples to be verified. Please create more examples!</p>
                                    </Col>
                                </Row>
                            </Card.Body>
                        )}
                    </Card>
                </Row>
                <KeyboardShortcuts
                    allowedShortcutsInText={["enter", "escape"]}
                    mapKeyToCallback={{
                        "arrowup": {
                            callback: (valState) => this.setQuestionValidationState(valState),
                            params: this.VALIDATION_STATES.CORRECT
                        },
                        "arrowdown": {
                            callback: (valState) => this.setQuestionValidationState(valState),
                            params: this.VALIDATION_STATES.INCORRECT
                        },
                        "f": {
                            callback: (valState) => this.setQuestionValidationState(valState),
                            params: this.VALIDATION_STATES.FLAGGED
                        },
                        "escape": {
                            callback: (valState) => this.setQuestionValidationState(valState),
                            params: this.VALIDATION_STATES.UNKNOWN
                        },
                        "arrowright": {
                            callback: (valState) => this.setResponseValidationState(valState),
                            params: this.VALIDATION_STATES.CORRECT
                        },
                        "arrowleft": {
                            callback: (valState) => this.setResponseValidationState(valState),
                            params: this.VALIDATION_STATES.INCORRECT
                        },
                        "s": {
                            callback: () => this.setState({ showInstructions: true })
                        },
                        "h": {
                            callback: () => this.setState({ showInstructions: false })
                        },
                        "enter": {
                            callback: () => this.submitValidation()
                        }
                    }}
                />
            </Container>
        )
    }
}

export { VQAValidationInterface }
