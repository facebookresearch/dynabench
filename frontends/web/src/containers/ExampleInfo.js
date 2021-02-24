/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { HateSpeechDropdown } from "./HateSpeechDropdown.js";
import {
    Col,
    DropdownButton,
    Dropdown,
    Form,
    InputGroup,
} from "react-bootstrap";

class ExampleContent extends React.Component {

    render() {
        return (
            <>
                {this.props.task.type === "clf" ? (
                    <div className="mb-3">
                        <h6 className="text-uppercase dark-blue-color spaced-header">
                            {this.props.task.shortname === "NLI"
                                ? "Hypothesis"
                                : "Statement"}
                            :
                        </h6>
                        <p>{this.props.example.text}</p>
                        <h6 className="text-uppercase dark-blue-color spaced-header">
                            Label:
                        </h6>
                        <p>{this.props.example.target}</p>
                        {this.props.example.example_explanation ? (
                            <>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                    Example explanation{" "}
                                    <small>(why target label is correct)</small>
                                </h6>
                                <p>{this.props.example.example_explanation}</p>
                            </>
                        ) : (
                            ""
                        )}
                        {this.props.example.model_explanation ? (
                            <>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                    Model explanation{" "}
                                    <small>
                                        (
                                        {this.props.example.model_wrong
                                            ? "why model was fooled"
                                            : "how they tried to trick the model"}
                                        )
                                    </small>
                                </h6>
                                <p>{this.props.example.model_explanation}</p>
                            </>
                        ) : (
                            ""
                        )}
                        {this.props.example.metadata_json ? (
                            JSON.parse(
                                this.props.example.metadata_json
                            ).hasOwnProperty("hate_type") ? (
                                <>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                        Hate Target:
                                    </h6>
                                    <p>
                                        {
                                            JSON.parse(
                                                this.props.example.metadata_json
                                            ).hate_type
                                        }
                                    </p>
                                </>
                            ) : (
                                ""
                            )
                        ) : (
                            ""
                        )}
                    </div>
                ) : this.props.task.type === "VQA" ? (
                    <div className="mb-3">
                        {this.props.validatingQuestion ? (
                            <>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                    Is the question below valid? (Please see
                                    instructions on the top to see what we mean
                                    by "valid". Warning: if you do not follow
                                    the instructions, you will be banned.):
                                </h6>
                                <p>{this.props.example.text}</p>
                            </>
                        ) : (
                            <>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                    Determine if the answer is correct:
                                </h6>
                                <p>
                                    {this.props.example.model_preds.split("|")[0]}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="mb-3">
                        <h6 className="text-uppercase dark-blue-color spaced-header">
                            Question:
                        </h6>
                        <p>{this.props.example.text}</p>
                        <h6 className="text-uppercase dark-blue-color spaced-header">
                            Answer:
                        </h6>
                        <p>{this.props.example.target_pred}</p>
                    </div>
                )}
            </>
        );
    }
}

class ExampleValidationActions extends React.Component {
    constructor() {
        super();
        this.inputRef = React.createRef();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.flagged !== this.props.flagged && this.props.flagged) {
            if (this.inputRef.current) {
                this.inputRef.current.focus();
            }
        }
    }

    render() {
        let positiveTerm = this.props.validatingQuestion ? "Valid" : "Correct";
        let negativeTerm = this.props.validatingQuestion
            ? "Invalid"
            : "Incorrect";
        if (this.props.isOwner) {
            positiveTerm = `Verified ${positiveTerm}`;
            negativeTerm = `Verified ${negativeTerm}`;
        }
        const { taskType, taskName } = this.props;
        return (
            <div className="mb-3">
                <div
                    className="d-flex flex-row"
                    onClick={() => {
                        !this.props.disabled && this.props.setCorrect();
                    }}
                >
                    <Form.Check
                        checked={this.props.correct}
                        onChange={() => this.props.setCorrect()}
                        type="radio"
                        disabled={this.props.disabled}
                    />
                    <i className="fas fa-thumbs-up"></i> &nbsp; {positiveTerm}
                </div>
                <div
                    className="d-flex flex-row"
                    onClick={() => {
                        !this.props.disabled && this.props.setIncorrect();
                    }}
                >
                    <Form.Check
                        checked={this.props.incorrect}
                        onChange={() => this.props.setIncorrect()}
                        type="radio"
                        disabled={this.props.disabled}
                    />
                    <i className="fas fa-thumbs-down"></i> &nbsp; {negativeTerm}
                </div>
                <InputGroup className="ml-3">
                    {taskType !== "VQA" &&
                        this.props.incorrect &&
                        {
                            NLI: (
                                <DropdownButton
                                    className="p-1"
                                    title={
                                        "Your corrected label: " +
                                        this.props.validatorLabel
                                    }
                                >
                                    {["entailed", "neutral", "contradictory"]
                                        .filter(
                                            (target, _) =>
                                                target !==
                                                this.props.example.target
                                        )
                                        .map((target, index) => (
                                            <Dropdown.Item
                                                onClick={() =>
                                                    this.props.setValidatorLabel(
                                                        target
                                                    )
                                                }
                                                key={index}
                                                index={index}
                                            >
                                                {target}
                                            </Dropdown.Item>
                                        ))}
                                </DropdownButton>
                            ),
                            QA:
                                "Please select the correct answer in the context. If it is not in the context, then flag this example.",
                            "Hate Speech": (
                                <div>
                                    You have proposed that the correct answer is{" "}
                                    <b>
                                        {
                                            ["hateful", "not-hateful"].filter(
                                                (target, _) =>
                                                    target !==
                                                    this.props.example.target
                                            )[0]
                                        }
                                    </b>
                                </div>
                            ),
                            Sentiment: (
                                <div>
                                    You have proposed that the correct answer is{" "}
                                    <b>
                                        {
                                            ["positive", "negative"].filter(
                                                (target, _) =>
                                                    target !==
                                                    this.props.example.target
                                            )[0]
                                        }
                                    </b>
                                </div>
                            ),
                        }[taskName]}
                </InputGroup>
                {!this.props.isOwner && this.props.isFlaggingAllowed && (
                    <div
                        className="d-flex flex-row"
                        onClick={() => {
                            this.props.setFlagged();
                        }}
                    >
                        <Form.Check
                            checked={this.props.flagged}
                            type="radio"
                            onChange={() => this.props.setFlagged()}
                        />
                        <i className="fas fa-flag"></i> &nbsp; Flag
                    </div>
                )}
                {this.props.flagged && (
                    <InputGroup className="ml-3">
                        <Col sm="12 p-1">
                            <Form.Control
                                ref={this.inputRef}
                                type="text"
                                placeholder="Reason for flagging"
                                onChange={(e) =>
                                    this.props.setFlagReason(e.target.value)
                                }
                            />
                        </Col>
                    </InputGroup>
                )}
                {taskType !== "VQA" &&
                    (this.props.incorrect ||
                        this.props.correct ||
                        this.props.flagged) && (
                        <div className="mt-2">
                            <h6 className="text-uppercase dark-blue-color spaced-header">
                                Optionally, provide an explanation for this
                                example:
                            </h6>
                            <div className="mt-3">
                                {(this.props.incorrect ||
                                    this.props.correct) && (
                                    <div>
                                        <Form.Control
                                            type="text"
                                            placeholder={
                                                "Explain why " +
                                                (taskName === "QA"
                                                    ? this.props.correct
                                                        ? "the given answer"
                                                        : "your proposed answer"
                                                    : this.props.correct
                                                    ? "the given label"
                                                    : "your proposed label") +
                                                " is correct"
                                            }
                                            onChange={(e) =>
                                                this.props.setLabelExplanation(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}
                                <div>
                                    <Form.Control
                                        type="text"
                                        placeholder="Explain what you think the creator did to try to trick the model"
                                        onChange={(e) =>
                                            this.props.setCreatorAttemptExplanation(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>
                                {taskName === "Hate Speech" && (
                                    <HateSpeechDropdown
                                        hateType={this.props.validatorHateType}
                                        dataIndex={this.props.index}
                                        onClick={(e) =>
                                            this.props.setValidatorHateType(
                                                e.target.getAttribute("data")
                                            )
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    )}
            </div>
        );
    }
}

export { ExampleContent, ExampleValidationActions };
