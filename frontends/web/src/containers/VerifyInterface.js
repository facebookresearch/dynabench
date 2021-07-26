/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  DropdownButton,
  Dropdown,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import UserContext from "./UserContext";
import { TokenAnnotator } from "react-text-annotate";
import { OverlayProvider, BadgeOverlay, Annotation } from "./Overlay";
import { ExampleValidationActions } from "./ExampleValidationActions.js";
import AtomicImage from "./AtomicImage.js";

function ContextInfo({
  needAnswer,
  taskShortname,
  text,
  answer,
  updateAnswer,
}) {
  return taskShortname === "VQA" ? (
    <AtomicImage src={text} maxHeight={400} maxWidth={700} />
  ) : needAnswer ? (
    <TokenAnnotator
      className="mb-1 p-3 light-gray-bg qa-context"
      tokens={text.split(/\b/)}
      value={answer}
      onChange={updateAnswer}
      getSpan={(span) => ({
        ...span,
        tag: "ANS",
      })}
    />
  ) : (
    <div className="mb-1 p-3 light-gray-bg">{text.replace("<br>", "\n")}</div>
  );
}

class VerifyInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.VALIDATION_STATES = {
      CORRECT: "correct",
      INCORRECT: "incorrect",
      VALID: "valid",
      INVALID: "invalid",
      FLAGGED: "flagged",
      UNKNOWN: "unknown",
    };
    this.state = {
      taskCode: null,
      task: {},

      owner_mode: false,
      ownerValidationFlagFilter: "Any",
      ownerValidationDisagreementFilter: "Any",

      questionValState: this.VALIDATION_STATES.UNKNOWN,
      responseValState: this.VALIDATION_STATES.UNKNOWN,
      validatorLabel: "",
      flagReason: null,
      labelExplanation: null,
      creatorAttemptExplanation: null,
      validatorHateType: null,
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.updateValidatorSelection = this.updateValidatorSelection.bind(this);
    this.getActionLabel = this.getActionLabel.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.setRangesAndGetRandomFilteredExample =
      this.setRangesAndGetRandomFilteredExample.bind(this);
    this.updateUserSettings = this.updateUserSettings.bind(this);
    this.updateOwnerValidationFlagFilter =
      this.updateOwnerValidationFlagFilter.bind(this);
    this.updateOwnerValidationDisagreementFilter =
      this.updateOwnerValidationDisagreementFilter.bind(this);
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent(
            "Please log in or sign up so that you can get credit for your generated examples."
          ) +
          "&src=" +
          encodeURIComponent(`/tasks/${params.taskCode}/create`)
      );
    }

    if (this.context.user.settings_json) {
      const settings_json = JSON.parse(this.context.user.settings_json);
      if (settings_json.hasOwnProperty("owner_validation_flag_filter")) {
        this.setState({
          ownerValidationFlagFilter:
            settings_json["owner_validation_flag_filter"],
        });
      }
      if (
        settings_json.hasOwnProperty("owner_validation_disagreement_filter")
      ) {
        this.setState({
          ownerValidationDisagreementFilter:
            settings_json["owner_validation_disagreement_filter"],
        });
      }
    }

    this.setState({ taskCode: params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          result.targets = result.targets.split("|"); // split targets
          this.setState(
            { task: result, taskCode: result.task_code },
            function () {
              this.state.task.selected_round = this.state.task.cur_round;
              this.getNewExample();
              if (params.taskCode !== this.state.taskCode) {
                // TODO: replace history
              }
            }
          );
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        }
      );
    });
  }

  getResetState() {
    return {
      responseValState: this.VALIDATION_STATES.UNKNOWN,
      validatorLabel: "",
      flagReason: null,
      labelExplanation: null,
      creatorAttemptExplanation: null,
      validatorHateType: null,
    };
  }

  updateValidatorSelection(updatedValues) {
    this.setState({
      ...this.getResetState(),
      ...updatedValues,
    });
  }

  getNewExample() {
    (this.state.owner_mode
      ? this.setRangesAndGetRandomFilteredExample()
      : this.context.api.getRandomExample(
          this.state.task.id,
          this.state.task.selected_round
        )
    ).then(
      (result) => {
        this.setState(function (prevState, _) {
          if (prevState.task.type !== "extract") {
            result.target =
              prevState.task.targets[parseInt(result.target_pred)];
          }
          return {
            ...this.getResetState(),
            example: result,
            questionValState: this.VALIDATION_STATES.UNKNOWN,
          };
        });
      },
      (error) => {
        console.log(error);
        this.setState({
          example: false,
        });
      }
    );
  }

  shouldDiscardValidatingExample() {
    const taskShortname = this.state.task.shortname;

    const questionValState = this.state.questionValState;
    const responseValState = this.state.responseValState;
    const validatorLabel = this.state.validatorLabel;
    const flagReason = this.state.flagReason;

    const UNKNOWN = this.VALIDATION_STATES.UNKNOWN;
    const VALID = this.VALIDATION_STATES.VALID;
    const INCORRECT = this.VALIDATION_STATES.INCORRECT;
    const CORRECT = this.VALIDATION_STATES.CORRECT;
    const FLAGGED = this.VALIDATION_STATES.FLAGGED;

    if (questionValState === FLAGGED || responseValState === FLAGGED) {
      return !flagReason || flagReason.trim().length === 0;
    }
    if (taskShortname === "VQA") {
      return (
        questionValState === UNKNOWN ||
        (questionValState === VALID && responseValState === UNKNOWN)
      );
    } else {
      return !(
        responseValState === CORRECT ||
        (responseValState === INCORRECT &&
          (taskShortname === "Sentiment" || taskShortname === "Hate Speech")) ||
        (responseValState === INCORRECT && validatorLabel !== "")
      );
    }
  }

  getActionLabel() {
    const questionValState = this.state.questionValState;
    const responseValState = this.state.responseValState;

    const VALID = this.VALIDATION_STATES.VALID;
    const INVALID = this.VALIDATION_STATES.INVALID;
    const FLAGGED = this.VALIDATION_STATES.FLAGGED;
    const INCORRECT = this.VALIDATION_STATES.INCORRECT;

    if (questionValState === FLAGGED || responseValState === FLAGGED) {
      return "flagged";
    } else if (questionValState === VALID) {
      return responseValState === INCORRECT ? "correct" : "incorrect";
    } else if (questionValState === INVALID) {
      return "incorrect";
    } else {
      return responseValState === INCORRECT ? "incorrect" : "correct";
    }
  }

  handleResponse() {
    if (this.shouldDiscardValidatingExample()) {
      return;
    }
    const mode = this.state.owner_mode ? "owner" : "user";
    const action = this.getActionLabel();
    var metadata = {};

    if (this.state.validatorLabel !== "") {
      metadata["validator_label"] = this.state.validatorLabel;
    }

    if (this.state.flagReason && this.state.flagReason.trim().length > 0) {
      metadata["flag_reason"] = this.state.flagReason.trim();
    }

    if (
      this.state.labelExplanation &&
      this.state.labelExplanation.trim().length > 0
    ) {
      metadata["example_explanation"] = this.state.labelExplanation.trim();
    }

    if (
      this.state.creatorAttemptExplanation &&
      this.state.creatorAttemptExplanation.trim().length > 0
    ) {
      metadata["model_explanation"] =
        this.state.creatorAttemptExplanation.trim();
    }

    if (this.state.validatorHateType !== null) {
      metadata["validator_hate_type"] = this.state.validatorHateType;
    }
    this.context.api
      .validateExample(this.state.example.id, action, mode, metadata)
      .then(
        (result) => {
          this.getNewExample();
          if (!!result.badges) {
            this.setState({ showBadges: result.badges });
          }
        },
        (error) => {
          console.log(error);
        }
      );
  }

  setRangesAndGetRandomFilteredExample() {
    var minNumFlags;
    var maxNumFlags;
    var minNumDisagreements;
    var maxNumDisagreements;

    if (this.state.ownerValidationFlagFilter === "Any") {
      minNumFlags = 0;
      maxNumFlags = 5;
    } else {
      minNumFlags = this.state.ownerValidationFlagFilter;
      maxNumFlags = this.state.ownerValidationFlagFilter;
    }

    if (this.state.ownerValidationDisagreementFilter === "Any") {
      minNumDisagreements = 0;
      maxNumDisagreements = 4;
    } else {
      minNumDisagreements = this.state.ownerValidationDisagreementFilter;
      maxNumDisagreements = this.state.ownerValidationDisagreementFilter;
    }

    return this.context.api.getRandomFilteredExample(
      this.state.task.id,
      this.state.task.selected_round,
      minNumFlags,
      maxNumFlags,
      minNumDisagreements,
      maxNumDisagreements
    );
  }

  updateUserSettings(key, value) {
    var settings_json;
    if (this.context.user.settings_json) {
      settings_json = JSON.parse(this.context.user.settings_json);
    } else {
      settings_json = {};
    }
    settings_json[key] = value;
    this.context.user.settings_json = JSON.stringify(settings_json);
    this.context.api.updateUser(this.context.user.id, this.context.user);
  }

  updateOwnerValidationFlagFilter(value) {
    this.updateUserSettings("owner_validation_flag_filter", value);
    this.setState({ ownerValidationFlagFilter: value }, () => {
      this.getNewExample();
    });
  }

  updateOwnerValidationDisagreementFilter(value) {
    this.updateUserSettings("owner_validation_disagreement_filter", value);
    this.setState({ ownerValidationDisagreementFilter: value }, () => {
      this.getNewExample();
    });
  }

  updateAnswer(value) {
    // Only keep the last answer annotated
    if (value.length > 0) {
      this.setState({
        validatorLabel: [value[value.length - 1]],
      });
    } else {
      this.setState({ validatorLabel: value });
    }
  }

  render() {
    const VALID = this.VALIDATION_STATES.VALID;
    const INVALID = this.VALIDATION_STATES.INVALID;
    const FLAGGED = this.VALIDATION_STATES.FLAGGED;
    const CORRECT = this.VALIDATION_STATES.CORRECT;
    const INCORRECT = this.VALIDATION_STATES.INCORRECT;

    const taskShortname = this.state.task.shortname;
    const taskType = this.state.task.type;
    const questionValState = this.state.questionValState;
    const responseValState = this.state.responseValState;
    const validatorLabel = this.state.validatorLabel;
    const validatorHateType = this.state.validatorHateType;
    const creatorAttemptExplanation = this.state.creatorAttemptExplanation;

    const shouldQuestionBeValidated = taskShortname === "VQA";
    const shouldResponseBeValidated =
      taskShortname !== "VQA" || questionValState === VALID;

    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <Container className="mb-5 pb-5">
          <Col className="m-auto" lg={12}>
            {this.context.api.isTaskOwner(
              this.context.user,
              this.state.task.id
            ) || this.context.user.admin ? (
              <div style={{ float: "right" }}>
                <Annotation
                  placement="top"
                  tooltip="Click to adjust your owner validation filters"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showOwnerValidationFiltersModal: true });
                    }}
                  >
                    <i className="fa fa-cog"></i>
                  </button>
                </Annotation>
                <Modal
                  show={this.state.showOwnerValidationFiltersModal}
                  onHide={() =>
                    this.setState({ showOwnerValidationFiltersModal: false })
                  }
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Owner Validation Filters</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form.Check
                      checked={this.state.owner_mode}
                      label="Enter task owner mode?"
                      onChange={() => {
                        this.setState(
                          { owner_mode: !this.state.owner_mode },
                          this.componentDidMount()
                        );
                      }}
                    />
                    {this.state.owner_mode ? (
                      <div>
                        <DropdownButton
                          variant="light"
                          className="p-1"
                          title={
                            this.state.ownerValidationFlagFilter.toString() +
                            " flag" +
                            (this.state.ownerValidationFlagFilter === 1
                              ? ""
                              : "s")
                          }
                        >
                          {["Any", 0, 1, 2, 3, 4, 5].map((target, index) => (
                            <Dropdown.Item
                              onClick={() =>
                                this.updateOwnerValidationFlagFilter(target)
                              }
                              key={index}
                              index={index}
                            >
                              {target}
                            </Dropdown.Item>
                          ))}
                        </DropdownButton>
                        <DropdownButton
                          variant="light"
                          className="p-1"
                          title={
                            this.state.ownerValidationDisagreementFilter.toString() +
                            " correct/incorrect disagreement" +
                            (this.state.ownerValidationDisagreementFilter === 1
                              ? ""
                              : "s")
                          }
                        >
                          {["Any", 0, 1, 2, 3, 4].map((target, index) => (
                            <Dropdown.Item
                              onClick={() =>
                                this.updateOwnerValidationDisagreementFilter(
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
                      </div>
                    ) : (
                      ""
                    )}
                  </Modal.Body>
                </Modal>
              </div>
            ) : (
              ""
            )}
            <div className="mt-4 mb-5 pt-3">
              <p className="text-uppercase mb-0 spaced-header">
                {this.state.task.name}
              </p>
              <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
                Validate examples
              </h2>
              <p>
                If a model was fooled, we need to make sure that the example is
                correct.
              </p>
            </div>
            {this.state.task.shortname === "Hate Speech" ? (
              <p className="mt-3 p-3 light-red-bg rounded white-color">
                <strong>WARNING</strong>: This is sensitive content! If you do
                not want to see any hateful examples, please switch to another
                task.
              </p>
            ) : null}
            <Card className="profile-card overflow-hidden">
              {this.state.example ? (
                <>
                  <div className="mb-1 p-3 light-gray-bg">
                    {taskShortname !== "VQA" && (
                      <h6 className="text-uppercase dark-blue-color spaced-header">
                        Context:
                      </h6>
                    )}
                    {this.state.example.context &&
                      this.state.example.context.context && (
                        <ContextInfo
                          text={this.state.example.context.context}
                          taskShortname={taskShortname}
                          needAnswer={
                            responseValState === INCORRECT &&
                            taskShortname === "QA"
                          }
                          answer={this.state.validatorLabel}
                          updateAnswer={this.updateAnswer}
                        />
                      )}
                  </div>
                  <Card.Body
                    className="overflow-auto pt-2"
                    style={{ height: 400 }}
                  >
                    <Card
                      className="hypothesis rounded border m-3 card"
                      style={{ minHeight: 120 }}
                    >
                      <Card.Body className="p-3">
                        <Row>
                          <Col xs={12} md={7}>
                            {shouldQuestionBeValidated && (
                              <>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                  Is the question below valid? (see instructions
                                  above to see what we mean by "valid")
                                </h6>
                                <p>{this.state.example.text}</p>
                                <ExampleValidationActions
                                  correctSelected={questionValState === VALID}
                                  incorrectSelected={
                                    questionValState === INVALID
                                  }
                                  flaggedSelected={questionValState === FLAGGED}
                                  setCorrectSelected={() =>
                                    this.updateValidatorSelection({
                                      questionValState: VALID,
                                    })
                                  }
                                  setIncorrectSelected={() =>
                                    this.updateValidatorSelection({
                                      questionValState: INVALID,
                                    })
                                  }
                                  setFlagSelected={() =>
                                    this.updateValidatorSelection({
                                      questionValState: FLAGGED,
                                    })
                                  }
                                  setFlagReason={(flagReason) =>
                                    this.setState({ flagReason })
                                  }
                                  isQuestion={true}
                                  isFlaggingAllowed={true}
                                  isExplainingAllowed={false}
                                  userMode={
                                    this.state.owner_mode ? "owner" : "user"
                                  }
                                  task={this.state.task}
                                />
                              </>
                            )}
                            {shouldResponseBeValidated && (
                              <>
                                {taskType === "extract" ? (
                                  <>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                      Question:
                                    </h6>
                                    <p>{this.state.example.text}</p>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                      Answer:
                                    </h6>
                                    <p>{this.state.example.target_pred}</p>
                                  </>
                                ) : taskType === "VQA" ? (
                                  <>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                      Determine if the answer is correct:
                                    </h6>
                                    <p>
                                      {
                                        this.state.example.model_preds.split(
                                          "|"
                                        )[0]
                                      }
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                      {taskShortname === "NLI"
                                        ? "Hypothesis"
                                        : "Statement"}
                                      :
                                    </h6>
                                    <p>{this.state.example.text}</p>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                      Label:
                                    </h6>
                                    <p>{this.state.example.target}</p>
                                    {this.state.example.example_explanation && (
                                      <>
                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                          Example explanation{" "}
                                          <small>
                                            (why target label is correct)
                                          </small>
                                        </h6>
                                        <p>
                                          {
                                            this.state.example
                                              .example_explanation
                                          }
                                        </p>
                                      </>
                                    )}
                                    {this.state.example.model_explanation && (
                                      <>
                                        <h6 className="text-uppercase dark-blue-color spaced-header">
                                          Model explanation{" "}
                                          <small>
                                            (
                                            {this.state.example.model_wrong
                                              ? "why model was fooled"
                                              : "how they tried to trick the model"}
                                            )
                                          </small>
                                        </h6>
                                        <p>
                                          {this.state.example.model_explanation}
                                        </p>
                                      </>
                                    )}
                                    {this.state.example.metadata_json &&
                                      JSON.parse(
                                        this.state.example.metadata_json
                                      ).hasOwnProperty("hate_type") && (
                                        <>
                                          <h6 className="text-uppercase dark-blue-color spaced-header">
                                            Hate Target:
                                          </h6>
                                          <p>
                                            {
                                              JSON.parse(
                                                this.state.example.metadata_json
                                              ).hate_type
                                            }
                                          </p>
                                        </>
                                      )}
                                  </>
                                )}
                                <ExampleValidationActions
                                  correctSelected={responseValState === CORRECT}
                                  incorrectSelected={
                                    responseValState === INCORRECT
                                  }
                                  flaggedSelected={responseValState === FLAGGED}
                                  validatorLabel={validatorLabel}
                                  validatorHateType={validatorHateType}
                                  creatorAttemptExplanation={
                                    creatorAttemptExplanation
                                  }
                                  example={this.state.example}
                                  task={this.state.task}
                                  userMode={
                                    this.state.owner_mode ? "owner" : "user"
                                  }
                                  isFlaggingAllowed={taskShortname !== "VQA"}
                                  isExplainingAllowed={taskShortname !== "VQA"}
                                  isQuestion={false}
                                  setCorrectSelected={() =>
                                    this.updateValidatorSelection({
                                      responseValState: CORRECT,
                                    })
                                  }
                                  setIncorrectSelected={() =>
                                    this.updateValidatorSelection({
                                      responseValState: INCORRECT,
                                    })
                                  }
                                  setFlagSelected={() =>
                                    this.updateValidatorSelection({
                                      responseValState: FLAGGED,
                                    })
                                  }
                                  setFlagReason={(flagReason) =>
                                    this.setState({ flagReason })
                                  }
                                  setValidatorLabel={(validatorLabel) =>
                                    this.setState({ validatorLabel })
                                  }
                                  setValidatorHateType={(validatorHateType) =>
                                    this.setState({ validatorHateType })
                                  }
                                  setLabelExplanation={(labelExplanation) =>
                                    this.setState({ labelExplanation })
                                  }
                                  setCreatorAttemptExplanation={(
                                    creatorAttemptExplanation
                                  ) =>
                                    this.setState({ creatorAttemptExplanation })
                                  }
                                />
                              </>
                            )}
                          </Col>
                        </Row>
                      </Card.Body>
                      <Card.Footer>
                        <InputGroup className="align-items-center">
                          <button
                            type="button"
                            className="btn btn-primary t btn-sm"
                            onClick={() => this.handleResponse()}
                          >
                            {" "}
                            Submit{" "}
                          </button>
                          {taskShortname !== "VQA" && (
                            <button
                              data-index={this.props.index}
                              onClick={this.getNewExample}
                              type="button"
                              className="btn btn-light btn-sm pull-right"
                            >
                              <i className="fas fa-undo-alt"></i> Skip and load
                              new example
                            </button>
                          )}
                        </InputGroup>
                      </Card.Footer>
                    </Card>
                    <div className="p-2">
                      {this.state.owner_mode ? (
                        <p style={{ color: "red" }}>
                          WARNING: You are in "Task owner mode." You can verify
                          examples as correct or incorrect without input from
                          anyone else!!
                        </p>
                      ) : (
                        ""
                      )}
                    </div>
                  </Card.Body>
                </>
              ) : (
                <Card.Body className="p-3">
                  <Row>
                    <Col xs={12} md={7}>
                      <p>Loading Examples...</p>
                    </Col>
                  </Row>
                </Card.Body>
              )}
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default VerifyInterface;
