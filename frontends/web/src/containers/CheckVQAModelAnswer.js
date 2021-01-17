/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import UserContext from "./UserContext";
import ExplainFeedback from "./ExplainFeedback";
import { Row, Col, InputGroup } from "react-bootstrap";

class CheckVQAModelAnswer extends React.Component {
    static contextType = UserContext;
    constructor(props) {
        super(props);
        this.updateExample = this.updateExample.bind(this);
        this.submitUserAnswer = this.submitUserAnswer.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleCorrectButtonClick = this.handleCorrectButtonClick.bind(this);
        this.handleIncorrectButtonClick = this.handleIncorrectButtonClick.bind(this);
        this.MODEL_STATES = this.props.MODEL_STATES;
        this.state = {
            correctAnswer: "",
            feedbackSaved: null,
            disableCorrectButton: false,
            disbaleSubmitButton: false
        };
    }

    updateExample(target, modelState) {
        const { exampleId } = this.props;
        this.context.api
        .updateExample(exampleId, target, modelState)
        .then((result) => {
            if (modelState === this.MODEL_STATES.INCORRECT) {
                this.props.getNewContext();
            } else if (modelState === this.MODEL_STATES.CORRECT) {
                this.setState({feedbackSaved: true});
                this.props.setModelState(modelState);
            }
        }, (error) => {
            console.log(error);
        });
    }

    handleKeyPress(e) {
        if (e.key === "Enter") {
           this.submitUserAnswer();
        }
    }

    submitUserAnswer() {
        const formattedAnswer = this.state.correctAnswer.trim();
        if (formattedAnswer.length > 0) {
            this.setState({
                disbaleSubmitButton: true,
                feedbackSaved: false
            }, () => {
                if (this.props.mode === "mturk") {
                    this.props.handleSubmitCorrectAnswer(formattedAnswer, this.MODEL_STATES.INCORRECT);
                } else {
                    this.updateExample(formattedAnswer, this.MODEL_STATES.INCORRECT);
                }
            });
        }
    }

    handleCorrectButtonClick(e) {
        e.preventDefault();
        this.setState({ disableCorrectButton: true })
        if (this.props.mode === "mturk") {
            this.props.handleSubmitCorrectAnswer(this.props.modelPredStr, this.MODEL_STATES.CORRECT);
        } else {
            this.updateExample(this.props.modelPredStr, this.MODEL_STATES.CORRECT);
        }
    }

    handleIncorrectButtonClick(e) {
        e.preventDefault();
        this.props.setModelState(this.MODEL_STATES.INCORRECT);
    }

    render() {
        if (this.props.modelState === this.MODEL_STATES.CORRECT) {
            return null;
        }
        return (
            <div className="mt-3">
                <span>The model predicted: <strong>{this.props.modelPredStr}</strong></span><br/>
                <span>
                    Is this answer correct? If not provide the correct answer.
                </span>
                <InputGroup className="d-flex justify-content-start" style={{marginTop: 10}}>
                    <button
                        type="button"
                        className={`btn btn-sm ${this.props.modelState === this.MODEL_STATES.CORRECT ? " btn-success" : " btn-outline-success"}`}
                        style={{marginRight: 5}}
                        onClick={this.handleCorrectButtonClick}
                        disabled={this.state.disableCorrectButton}>
                            Correct
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${this.props.modelState === this.MODEL_STATES.INCORRECT ? " btn-danger" : " btn-outline-danger"}`}
                        onClick={this.handleIncorrectButtonClick}>
                        Incorrect
                    </button>
                </InputGroup>
                { this.props.modelState === this.MODEL_STATES.INCORRECT &&
                    (
                        <div className="mt-1">
                            <Row>
                                <Col className="mt-2 pr-1">
                                    <ExplainFeedback feedbackSaved={this.state.feedbackSaved} type="answer"/>
                                    <input type="text" style={{width: 100+'%'}}  placeholder={"Provide the correct answer"}
                                        onChange={(e) => {this.setState({correctAnswer: e.target.value})}} onKeyPress={this.handleKeyPress}/>
                                </Col>
                                <Col className="align-self-end justify-content-start pl-0" md="auto">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={this.submitUserAnswer}
                                        disabled={this.state.disbaleSubmitButton}>
                                        Submit
                                    </button>
                                </Col>
                            </Row>
                        </div>
                    )
                }
            </div>
        )
    }
}

export default CheckVQAModelAnswer;
