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

class ExampleValidationActions extends React.Component {
  constructor() {
    super();
    this.inputRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.flaggedSelected !== this.props.flaggedSelected &&
      this.props.flaggedSelected
    ) {
      if (this.inputRef.current) {
        this.inputRef.current.focus();
      }
    }
  }

  render() {
    const positiveTerm = this.props.isQuestion ? "Valid" : "Correct";
    const negativeTerm = this.props.isQuestion ? "Invalid" : "Incorrect";
    return (
      <div className="my-3">
        <h6 className="text-uppercase dark-blue-color spaced-header">
          {this.props.header || "Actions"}
        </h6>
        <div
          className="d-flex flex-row"
          onClick={() => {
            !this.props.disabled && this.props.setCorrectSelected();
          }}
        >
          <Form.Check
            checked={this.props.correctSelected}
            onChange={() => this.props.setCorrectSelected()}
            type="radio"
            disabled={this.props.disabled}
          />
          <i className="fas fa-thumbs-up"></i> &nbsp;{" "}
          {this.props.userMode === "owner" ? "Verified " : ""} {positiveTerm}
        </div>
        <div
          className="d-flex flex-row"
          onClick={() => {
            !this.props.disabled && this.props.setIncorrectSelected();
          }}
        >
          <Form.Check
            checked={this.props.incorrectSelected}
            onChange={() => this.props.setIncorrectSelected()}
            type="radio"
            disabled={this.props.disabled}
          />
          <i className="fas fa-thumbs-down"></i> &nbsp;{" "}
          {this.props.userMode === "owner" ? "Verified " : ""} {negativeTerm}
        </div>
        {this.props.isExplainingAllowed &&
          this.props.task &&
          this.props.incorrectSelected && (
            <InputGroup className="ml-3">
              {
                {
                  NLI: (
                    <DropdownButton
                      className="p-1"
                      title={
                        "Your corrected label: " + this.props.validatorLabel
                      }
                    >
                      {["entailed", "neutral", "contradictory"]
                        .filter(
                          (target, _) => target !== this.props.example.target
                        )
                        .map((target, index) => (
                          <Dropdown.Item
                            onClick={() => this.props.setValidatorLabel(target)}
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
                            (target, _) => target !== this.props.example.target
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
                            (target, _) => target !== this.props.example.target
                          )[0]
                        }
                      </b>
                    </div>
                  ),
                }[this.props.task.shortname]
              }
            </InputGroup>
          )}
        {this.props.userMode === "user" && this.props.isFlaggingAllowed && (
          <div
            className="d-flex flex-row"
            onClick={() => {
              this.props.setFlagSelected();
            }}
          >
            <Form.Check
              checked={this.props.flaggedSelected}
              type="radio"
              onChange={() => this.props.setFlagSelected()}
            />
            <i className="fas fa-flag"></i> &nbsp; Flag
          </div>
        )}
        {this.props.flaggedSelected && (
          <InputGroup className="ml-3">
            <Col sm="12 p-1">
              <Form.Control
                ref={this.inputRef}
                type="text"
                placeholder="Reason for flagging"
                onChange={(e) => this.props.setFlagReason(e.target.value)}
              />
            </Col>
          </InputGroup>
        )}
        {(this.props.incorrectSelected ||
          this.props.correctSelected ||
          this.props.flaggedSelected) && (
          <div>
            {this.props.isExplainingAllowed && (
              <div className="mt-3">
                <h6 className="text-uppercase dark-blue-color spaced-header">
                  Optionally, provide an explanation for this example:
                </h6>
                <div className="mt-3">
                  {(this.props.incorrectSelected ||
                    this.props.correctSelected) &&
                    this.props.task && (
                      <div>
                        <Form.Control
                          type="text"
                          placeholder={
                            "Explain why " +
                            (this.props.task.shortname === "QA"
                              ? this.props.correctSelected
                                ? "the given answer"
                                : "your proposed answer"
                              : this.props.correctSelected
                              ? "the given label"
                              : "your proposed label") +
                            " is correct"
                          }
                          onChange={(e) =>
                            this.props.setLabelExplanation(e.target.value)
                          }
                        />
                      </div>
                    )}
                  <div>
                    <Form.Control
                      type="text"
                      placeholder="Explain what you think the creator did to try to trick the model"
                      onChange={(e) =>
                        this.props.setCreatorAttemptExplanation(e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            {this.props.task && this.props.task.shortname === "Hate Speech" && (
              <HateSpeechDropdown
                hateType={this.props.validatorHateType}
                dataIndex={this.props.index}
                onClick={(e) =>
                  this.props.setValidatorHateType(e.target.getAttribute("data"))
                }
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

export { ExampleValidationActions };
