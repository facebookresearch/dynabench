/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import AtomicImage from "../../../src/containers/AtomicImage.js";
import {
    Card,
    Row,
    Col,
    Form,
    InputGroup,
} from 'react-bootstrap';

class VQAQuizCard extends React.Component {

    constructor(props) {
        super(props);
        this.MODEL_STATES = this.props.MODEL_STATES;
        this.VALIDATION_TYPES = this.props.VALIDATION_TYPES
    }

    render() {
        return (
            <Card className="d-flex justify-content-center overflow-hidden pt-2" style={{ marginBottom: 5 }}>
                <AtomicImage src={this.props.imageUrl} maxWidth={500} maxHeight={400}/>
                <Card.Body className="overflow-auto pt-2" style={{ height: "auto" }}>
                    <Card
                        className="hypothesis rounded border m-3 card"
                        style={{ minHeight: 120 }}>
                        <Card.Body className="p-3">
                            <Row>
                                <Col xs={12} md={7}>
                                    <div className="mb-3">
                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                            Question:
                                        </h6>
                                        <p>
                                            {this.props.question}
                                        </p>
                                        {this.props.isAnswer && <>
                                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                                AI's answer:
                                            </h6>
                                            <p>
                                                {this.props.answer}
                                            </p>
                                        </>}
                                    </div>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                        {this.props.isAnswer ? (
                                            "Determine"
                                        ) : (
                                            "Do you need to look at the image to answer this question?"
                                        )}:
                                    </h6>
                                    <div>
                                        <InputGroup className="align-items-center">
                                            <Form.Check
                                                checked={this.props.modelState === this.MODEL_STATES.CORRECT}
                                                disabled={this.props.disableRadios}
                                                type="radio"
                                                onChange={() => {this.props.setModelState(this.props.index, this.MODEL_STATES.CORRECT)}}
                                            />
                                            <i className="fas fa-thumbs-up"></i>
                                            {this.props.isAnswer ? (
                                            "Correct"
                                            ) : (
                                                "Depends on the image"
                                            )}
                                        </InputGroup>
                                        <InputGroup className="align-items-center">
                                        <Form.Check
                                            checked={this.props.modelState === this.MODEL_STATES.INCORRECT}
                                            disabled={this.props.disableRadios}
                                            type="radio"
                                            onChange={() => {this.props.setModelState(this.props.index, this.MODEL_STATES.INCORRECT)}}
                                            />
                                            <i className="fas fa-thumbs-down"></i>
                                            {this.props.isAnswer ? (
                                            "Incorrect"
                                            ) : (
                                                "Independent of the image"
                                            )}
                                        </InputGroup>
                                    </div>
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
        )
    }
}

export { VQAQuizCard };
