/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import AtomicImage from "../../../../../src/containers/AtomicImage.js";
import { ExampleValidationActions } from "../../../../../src/containers/ExampleInfo.js";
import { Card, Row, Col } from "react-bootstrap";

class VQAQuizCard extends React.Component {
    constructor(props) {
        super(props);
        this.MODEL_STATES = this.props.MODEL_STATES;
    }

    render() {
        return (
            <Card className="d-flex justify-content-center hypothesis mb-5">
                <AtomicImage
                    src={this.props.imageUrl}
                    maxHeight={400}
                    maxWidth={600}
                />
                <Card.Body
                    className="overflow-auto pt-2"
                    style={{ height: "auto" }}
                >
                    <Card
                        className="hypothesis rounded border m-3 card"
                        style={{ minHeight: 120 }}
                    >
                        <Card.Body className="p-3">
                            <Row>
                                <Col xs={12} md={7}>
                                    <div className="mb-3">
                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                            Question:
                                        </h6>
                                        <p>{this.props.question}</p>
                                        {this.props.isAnswer && (
                                            <>
                                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                                    {this.props
                                                        .onboardingMode ===
                                                    "creation"
                                                        ? "AI's "
                                                        : ""}{" "}
                                                    answer:
                                                </h6>
                                                <p>{this.props.answer}</p>
                                            </>
                                        )}
                                    </div>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                        {this.props.isAnswer
                                            ? "Determine"
                                            : "Is the question above valid? (refer to the instructions to see the concept of valid and invalid questions)."}
                                    </h6>
                                    <ExampleValidationActions
                                        correct={
                                            this.props.modelState ===
                                            this.MODEL_STATES.CORRECT
                                        }
                                        incorrect={
                                            this.props.modelState ===
                                            this.MODEL_STATES.INCORRECT
                                        }
                                        isOwner={false}
                                        validatingQuestion={!this.props.isAnswer}
                                        disabled={this.props.disableRadios}
                                        isFlaggingAllowed={false}
                                        setCorrect={() => {
                                            this.props.setModelState(
                                                this.props.index,
                                                this.MODEL_STATES.CORRECT
                                            );
                                        }}
                                        setIncorrect={() => {
                                            this.props.setModelState(
                                                this.props.index,
                                                this.MODEL_STATES.INCORRECT
                                            );
                                        }}
                                        taskType="VQA"
                                    />
                                </Col>
                            </Row>
                        </Card.Body>
                        {this.props.hint.length > 0 && (
                            <Card.Footer className="response-warning">
                                <small>{this.props.hint}</small>
                            </Card.Footer>
                        )}
                    </Card>
                </Card.Body>
            </Card>
        );
    }
}

export { VQAQuizCard };
