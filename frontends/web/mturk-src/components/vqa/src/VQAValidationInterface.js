/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import AtomicImage from "../../../../src/containers/AtomicImage.js";
import { MagnifiedImage } from "../../../../src/containers/MagnifiedImage.js";
import { ExampleValidationActions } from "../../../../src/containers/ExampleValidationActions.js";
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
        this.batchAmount = 5;
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
            magnifiedImageSrc: null,
            flagReason: null,
            taskId: props.taskConfig.task_id,
            showInstructions: true,
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

    getNewExample = () => {
        this.api.getRandomExample(this.vqaTaskId, this.state.task.selected_round)
        .then((result) => {
            this.setState({
                example: result,
                questionValidationState: this.VALIDATION_STATES.UNKNOWN,
                responseValidationState: this.VALIDATION_STATES.UNKNOWN,
                flagReason: null,
            });
        }, (error) => {
            console.log(error);
            this.setState({ example: null });
        });
    }

    submitValidation = () => {
        if ((this.state.questionValidationState === this.VALIDATION_STATES.UNKNOWN) ||
            (this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && this.state.responseValidationState.UNKNOWN)) {
                return;
        }
        let action = null;
        if (this.state.questionValidationState === this.VALIDATION_STATES.FLAGGED || this.state.responseValidationState === this.VALIDATION_STATES.FLAGGED) {
            action = "flagged"
        } else if (this.state.questionValidationState === this.VALIDATION_STATES.INCORRECT || this.state.responseValidationState === this.VALIDATION_STATES.INCORRECT) {
            action = "incorrect"
        } else if (this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && this.state.responseValidationState === this.VALIDATION_STATES.CORRECT) {
            action = "correct"
        }
        const metadata = {
            annotator_id: this.props.providerWorkerId,
        }
        this.api.validateExample(this.state.example.id, action, this.userMode, metadata, this.props.providerWorkerId)
        .then(result => {
            this.setState({ totalValidationsSoFar: this.state.totalValidationsSoFar + 1 }, () => {
                if (this.state.totalValidationsSoFar === this.batchAmount) {
                    this.props.onSubmit(this.state);
                } else {
                    this.getNewExample();
                }
            })
	    }), (error) => {
            console.log(error);
	    }
    }

    render() {
        const validationInstructions = this.state.showInstructions ? (
            <p>
                You will be shown an image and a question.
                First, you have to determine if the question is <b className="dark-blue-color">valid</b>, this means
                that <b style={{ color: "red" }}>the image is required to answer the question and the question can be answered based on the image</b>.
                If it is, your task is to <b>determine whether the provided answer is correct</b>.
                If you think the example should be reviewed, please click the <b>Flag</b> button and explain why
                you flagged the example.
            </p>
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
                {validationInstructions}
                <Row>
                    <Card style={{ width: '100%'}}>
                        {this.state.example ? (
                            <>
                                <Card.Body className="d-flex justify-content-center pt-2" style={{ height: "auto", overflowY: "scroll" }}>
                                    <AtomicImage
                                        src={this.state.example.context.context}
                                        setMagnifiedImageSrc={src => this.setState({ magnifiedImageSrc: src })}
                                        maxHeight={500}
                                        maxWidth={600}/>
                                </Card.Body>
                                <Card className="hypothesis rounded border m-3 card">
                                    <Card.Body className="p-3">
                                        <Row>
                                            <Col xs={12} md={7}>
                                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                                    Determine if this question is valid:
                                                </h6>
                                                <p>
                                                    {this.state.example.text}
                                                </p>
                                                <ExampleValidationActions
                                                    correctSelected={this.state.questionValidationState === this.VALIDATION_STATES.CORRECT}
                                                    incorrectSelected={this.state.questionValidationState === this.VALIDATION_STATES.INCORRECT}
                                                    flaggedSelected={this.state.questionValidationState === this.VALIDATION_STATES.FLAGGED}
                                                    isQuestion={true}
                                                    userMode={this.userMode}
                                                    interfaceMode={this.interfaceMode}
                                                    setCorrectSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.CORRECT, flagReason: null })}
                                                    setIncorrectSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.INCORRECT, flagReason: null })}
                                                    setFlagSelected={() => this.setState({ questionValidationState: this.VALIDATION_STATES.FLAGGED })}
                                                    setFlagReason={flagReason => this.setState({ flagReason })}
                                                />
                                                {this.state.questionValidationState === this.VALIDATION_STATES.CORRECT && (
                                                    <div className="mt-3">
                                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                                            Determine if the answer proposed by the AI is correct:
                                                        </h6>
                                                        <p>
                                                            {this.state.example.target_pred}
                                                        </p>
                                                        <ExampleValidationActions
                                                            correctSelected={this.state.responseValidationState === this.VALIDATION_STATES.CORRECT}
                                                            incorrectSelected={this.state.responseValidationState === this.VALIDATION_STATES.INCORRECT}
                                                            flaggedSelected={this.state.responseValidationState === this.VALIDATION_STATES.FLAGGED}
                                                            userMode={this.userMode}
                                                            isQuestion={false}
                                                            interfaceMode={this.interfaceMode}
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
                                                onClick={this.submitValidation}>
                                                Submit
                                            </button>
                                            {taskTracker}
                                        </InputGroup>
                                    </Card.Footer>
                                </Card>
                                {this.state.magnifiedImageSrc && (
                                    <MagnifiedImage
                                        src={this.state.magnifiedImageSrc}
                                        setMagnifiedImageSrc={src => this.setState({ magnifiedImageSrc: src })}
                                    />
                                )}
                            </>
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
            </Container>
        )
    }
}

export { VQAValidationInterface }
