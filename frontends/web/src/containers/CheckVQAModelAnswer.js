/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import ExplainFeedback from "./ExplainFeedback";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import { Row, Col, InputGroup } from "react-bootstrap";

class CheckVQAModelAnswer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            correctAnswer: "",
            disableSubmit: false,
        };
    }

    handleKeyPress = (e) => {
        if (e.key.toLowerCase() === "enter") {
           this.submitUserAnswer();
        }
    }

    submitUserAnswer = () => {
        if (!this.state.disableSubmit) {
            const formattedAnswer = this.state.correctAnswer.trim();
            if (formattedAnswer.length > 0) {
                this.setState({ disableSubmit: true }, () => {
                    this.props.updateExample(formattedAnswer, "yes");
                });
            }
        }
    }

    handleCorrectButtonClick = () => {
        if (!this.state.disableSubmit) {
            this.setState({ disableSubmit: true }, () => {
                this.props.updateExample(this.props.modelPredStr, "no");
            });
        }
    }

    handleIncorrectButtonClick = () => {
        this.props.setModelState("yes");
    }

    render() {
        if (this.props.fooled === "no") {
            return null;
        } else if (this.props.loadingResponse) {
            return (
                <div className="d-flex align-items-center justify-content-center" style={{ width: "100%", height: 120 }}>
                    <div className="spinner-border" role="status"/>
                </div>
            )
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
                        className={`btn btn-sm ${this.props.fooled === "no" ? " btn-success" : " btn-outline-success"}`}
                        style={{marginRight: 5}}
                        onClick={this.handleCorrectButtonClick}>
                            Correct
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm ${this.props.fooled === "yes" ? " btn-danger" : " btn-outline-danger"}`}
                        onClick={this.handleIncorrectButtonClick}
                        disabled={this.state.disableSubmit}>
                            Incorrect
                    </button>
                </InputGroup>
                { this.props.fooled === "yes" &&
                    (
                        <div className="mt-1">
                            <Row>
                                <Col className="mt-2 pr-1">
                                    <ExplainFeedback feedbackSaved={this.props.feedbackSaved} type="answer"/>
                                    <input type="text" autoFocus style={{width: 100+'%'}}  placeholder={"Provide the correct answer. Please make sure the correct answer follows our requirements in the instructions."}
                                        onChange={(e) => {this.setState({correctAnswer: e.target.value})}} onKeyPress={this.handleKeyPress}/>
                                </Col>
                                <Col className="align-self-end justify-content-start pl-0" md="auto">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-primary"
                                        onClick={this.submitUserAnswer}
                                        disabled={this.state.disableSubmit}>
                                            Submit
                                    </button>
                                </Col>
                            </Row>
                        </div>
                    )
                }
                <KeyboardShortcuts
                    mapKeyToCallback={{
                        "w": {
                            callback: () => this.handleCorrectButtonClick(),
                        },
                        "s": {
                            callback: () => this.handleIncorrectButtonClick(),
                        },
                    }}
                />
            </div>
        )
    }
}

export default CheckVQAModelAnswer;
