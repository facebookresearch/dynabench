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
  Button,
  InputGroup,
} from "react-bootstrap";
import UserContext from "./UserContext";
import { OverlayProvider, BadgeOverlay, Annotation } from "./Overlay";
import IO from "./IO.js";

class VerifyInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskCode: null,
      task: {},
      example: {},
      owner_mode: false,
      ownerValidationFlagFilter: "Any",
      ownerValidationDisagreementFilter: "Any",
      correctSelected: false,
      incorrectSelected: false,
      flaggedSelected: false,
      flagReason: null,
      labelExplanation: null,
      creatorAttemptExplanation: null,
      hide_by_key: new Set(),
      input_io_def: [],
      output_io_def: [],
      context_io_def: [],
      model_metadata_io_def: [],
      user_metadata_model_correct_io_def: [],
      user_metadata_model_wrong_io_def: [],
      example_io: {},
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.resetValidatorSelections = this.resetValidatorSelections.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.setRangesAndGetRandomFilteredExample = this.setRangesAndGetRandomFilteredExample.bind(
      this
    );
    this.updateUserSettings = this.updateUserSettings.bind(this);
    this.updateOwnerValidationFlagFilter = this.updateOwnerValidationFlagFilter.bind(
      this
    );
    this.updateOwnerValidationDisagreementFilter = this.updateOwnerValidationDisagreementFilter.bind(
      this
    );
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
          encodeURIComponent(`/tasks/${params.taskCode}/validate`)
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
          this.setState(
            { task: result, taskCode: result.task_code },
            function () {
              this.state.task.selected_round = this.state.task.cur_round;
              this.getNewExample();
              if (params.taskCode !== this.state.taskCode) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${params.taskCode}`,
                    `/tasks/${this.state.taskCode}`
                  ),
                  search: this.props.location.search,
                });
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

  resetValidatorSelections(callback) {
    return this.setState(
      {
        correctSelected: false,
        flaggedSelected: false,
        incorrectSelected: false,
        flagReason: null,
        labelExplanation: null,
        creatorAttemptExplanation: null,
      },
      callback
    );
  }

  getNewExample() {
    this.resetValidatorSelections(() =>
      (this.state.owner_mode
        ? this.setRangesAndGetRandomFilteredExample()
        : this.context.api.getRandomExample(
            this.state.task.id,
            this.state.task.selected_round
          )
      ).then(
        (result) => {
          const input_io_def = JSON.parse(this.state.task.input_io_def);
          const output_io_def = JSON.parse(this.state.task.output_io_def);
          const context_io_def = JSON.parse(this.state.task.context_io_def);
          const model_metadata_io_def = JSON.parse(
            this.state.task.model_metadata_io_def
          );
          const user_metadata_model_wrong_io_def = JSON.parse(
            this.state.task.user_metadata_model_wrong_io_def
          );
          const user_metadata_model_correct_io_def = JSON.parse(
            this.state.task.user_metadata_model_correct_io_def
          );

          const example_io = {};
          const context_io = JSON.parse(result.context.context_io);
          for (const key in context_io) {
            example_io[key] = context_io[key];
          }
          const input_io = JSON.parse(result.input_io);
          for (const key in input_io) {
            example_io[key] = input_io[key];
          }
          const user_output_io = JSON.parse(result.user_output_io);
          for (const key in user_output_io) {
            example_io[key] = user_output_io[key];
          }
          const user_metadata_io = JSON.parse(result.user_metadata_io);
          for (const key in user_metadata_io) {
            example_io[key] = user_metadata_io[key];
          }

          this.setState({
            example: result,
            example_io: example_io,
            input_io_def: input_io_def,
            output_io_def: output_io_def,
            context_io_def: context_io_def,
            model_metadata_io_def: model_metadata_io_def,
            user_metadata_model_wrong_io_def: user_metadata_model_wrong_io_def,
            user_metadata_model_correct_io_def: user_metadata_model_correct_io_def,
          });
        },
        (error) => {
          console.log(error);
          this.setState({
            example: false,
          });
        }
      )
    );
  }
  handleResponse() {
    var action;
    if (this.state.correctSelected) {
      action = "correct";
    } else if (this.state.incorrectSelected) {
      action = "incorrect";
    } else if (this.state.flaggedSelected) {
      action = "flagged";
    }
    const mode = this.state.owner_mode ? "owner" : "user";
    var metadata = {};

    if (this.state.flagReason !== null) {
      metadata["flag_reason"] = this.state.flagReason;
    }

    if (this.state.labelExplanation !== null) {
      metadata["example_explanation"] = this.state.labelExplanation;
    }

    if (this.state.creatorAttemptExplanation !== null) {
      metadata["model_explanation"] = this.state.creatorAttemptExplanation;
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

  render() {
    console.log(this.state.example_io);
    const inputOutputUserMetadataIO = this.state.input_io_def
      .concat(this.state.output_io_def)
      .concat(
        this.state.example.model_wrong
          ? this.state.user_metadata_model_wrong_io_def
          : this.state.user_metadata_model_correct_io_def
      )
      .filter(
        (io_obj) =>
          ![undefined, null].includes(this.state.example_io[io_obj.name])
      )
      .map((io_obj, _) => (
        <IO
          key={io_obj.name}
          create={false}
          name={io_obj.name}
          example_io={this.state.example_io}
          set_example_io={() => {}}
          type={io_obj.type}
          constructor_args={io_obj.constructor_args}
        />
      ));

    const contextIO = this.state.context_io_def.map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={false}
        name={io_obj.name}
        example_io={this.state.example_io}
        set_example_io={() => {}}
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

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
            <div className="mt-4 pt-3">
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
            {this.state.task.warning_message ? (
              <p className="mt-3 p-3 light-red-bg rounded white-color">
                <strong>WARNING</strong>: {this.state.task.warning_message}
              </p>
            ) : null}
            <Card className="profile-card">
              {this.state.example ? (
                <>
                  {contextIO && contextIO.length > 0 ? (
                    <div className="mb-1 p-3 rounded light-gray-bg">
                      {contextIO}
                    </div>
                  ) : (
                    ""
                  )}
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12} md={7}>
                        {inputOutputUserMetadataIO}
                        <br />
                        <div className="mb-3">
                          {this.state.example.example_explanation ? (
                            <>
                              <h6 className="text-uppercase dark-blue-color spaced-header">
                                Example explanation{" "}
                                <small>(why target label is correct)</small>
                              </h6>
                              <p>{this.state.example.example_explanation}</p>
                            </>
                          ) : (
                            ""
                          )}
                          {this.state.example.model_explanation ? (
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
                              <p>{this.state.example.model_explanation}</p>
                            </>
                          ) : (
                            ""
                          )}
                        </div>
                        <h6 className="text-uppercase dark-blue-color spaced-header">
                          Actions:
                        </h6>
                        <p>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={this.state.correctSelected}
                              type="radio"
                              onChange={() =>
                                this.resetValidatorSelections(() =>
                                  this.setState({ correctSelected: true })
                                )
                              }
                            />
                            <i className="fas fa-thumbs-up"></i> &nbsp;{" "}
                            {this.state.owner_mode ? "Verified " : ""} Correct
                          </InputGroup>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={this.state.incorrectSelected}
                              type="radio"
                              onChange={() =>
                                this.resetValidatorSelections(() =>
                                  this.setState({ incorrectSelected: true })
                                )
                              }
                            />
                            <i className="fas fa-thumbs-down"></i> &nbsp;{" "}
                            {this.state.owner_mode ? "Verified " : ""} Incorrect
                          </InputGroup>
                          {this.state.owner_mode ? (
                            ""
                          ) : (
                            <InputGroup className="align-items-center">
                              <Form.Check
                                checked={this.state.flaggedSelected}
                                type="radio"
                                onChange={() =>
                                  this.resetValidatorSelections(() =>
                                    this.setState({ flaggedSelected: true })
                                  )
                                }
                              />
                              <i className="fas fa-flag"></i> &nbsp; Flag
                            </InputGroup>
                          )}
                          <InputGroup className="ml-3">
                            {this.state.flaggedSelected ? (
                              <Col sm="12 p-1">
                                <Form.Control
                                  type="text"
                                  placeholder="Reason for flagging"
                                  onChange={(e) =>
                                    this.setState({
                                      flagReason: e.target.value,
                                    })
                                  }
                                />
                              </Col>
                            ) : (
                              ""
                            )}
                          </InputGroup>
                        </p>
                        {this.state.incorrectSelected ||
                        this.state.correctSelected ||
                        this.state.flaggedSelected ? (
                          <div>
                            <h6 className="text-uppercase dark-blue-color spaced-header">
                              Optionally, provide an explanation for this
                              example:
                            </h6>
                            <p>
                              <div className="mt-3">
                                {this.state.incorrectSelected ||
                                this.state.correctSelected ? (
                                  <div>
                                    <Form.Control
                                      type="text"
                                      placeholder={
                                        "Explain why the given example is " +
                                        (this.state.correctSelected
                                          ? "correct"
                                          : "incorrect")
                                      }
                                      onChange={(e) =>
                                        this.setState({
                                          labelExplanation: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                ) : (
                                  ""
                                )}
                                <div>
                                  <Form.Control
                                    type="text"
                                    placeholder="Explain what you think the creator did to try to trick the model"
                                    onChange={(e) =>
                                      this.setState({
                                        creatorAttemptExplanation:
                                          e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </p>
                          </div>
                        ) : (
                          ""
                        )}
                      </Col>
                    </Row>
                    <InputGroup className="align-items-center">
                      <Button
                        type="button"
                        className="font-weight-bold blue-bg border-0 task-action-btn"
                        onClick={() => this.handleResponse()}
                      >
                        {" "}
                        Submit{" "}
                      </Button>
                      <Button
                        data-index={this.props.index}
                        onClick={this.getNewExample}
                        type="button"
                        className="font-weight-bold blue-color light-gray-bg border-0 task-action-btn"
                      >
                        <i className="fas fa-undo-alt"></i> Skip and load new
                        example
                      </Button>
                    </InputGroup>
                  </Card.Body>
                </>
              ) : (
                <Card.Body className="p-3">
                  <Row>
                    <Col xs={12} md={7}>
                      <p>
                        No more examples to be verified. Please create more
                        examples!
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              )}
              <div className="p-2">
                {this.state.owner_mode ? (
                  <p style={{ color: "red" }}>
                    WARNING: You are in "Task owner mode." You can verify
                    examples as correct or incorrect without input from anyone
                    else!!
                  </p>
                ) : (
                  ""
                )}
              </div>
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default VerifyInterface;
