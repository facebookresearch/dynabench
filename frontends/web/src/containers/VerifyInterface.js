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
  Spinner,
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
      validatorAction: null,
      io_def: {
        input: [],
        target: [],
        context: [],
        metadata: { create: [], validate: [] },
      },
      input_io: {},
      target_io: {},
      context_io: {},
      metadata_io: {},
      validator_metadata_io: {},
      loading: true,
    };
    this.getNewExample = this.getNewExample.bind(this);
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

  getNewExample() {
    this.setState(
      {
        input_io: {},
        target_io: {},
        context_io: {},
        output_io: {},
        metadata_io: {},
        validator_metadata_io: {},
        loading: true,
      },
      () =>
        (this.state.owner_mode
          ? this.setRangesAndGetRandomFilteredExample()
          : this.context.api.getRandomExample(
              this.state.task.id,
              this.state.task.selected_round
            )
        ).then(
          (result) => {
            const io_def = JSON.parse(this.state.task.io_def);
            const context_io = JSON.parse(result.context.context_io);
            const input_io = JSON.parse(result.input_io);
            const target_io = JSON.parse(result.target_io);
            const metadata_io = JSON.parse(result.metadata_io);
            const validator_metadata_io = {};
            for (const io_def_obj of io_def.metadata.validate) {
              validator_metadata_io[io_def_obj.name] = null;
            }

            this.setState({
              example: result,
              io_def: io_def,
              input_io: input_io,
              target_io: target_io,
              context_io: context_io,
              metadata_io: metadata_io,
              validator_metadata_io: validator_metadata_io,
              loading: false,
            });
          },
          (error) => {
            console.log(error);
            this.setState({
              loading: false,
              example: false,
            });
          }
        )
    );
  }

  handleResponse() {
    const mode = this.state.owner_mode ? "owner" : "user";

    this.context.api
      .validateExample(
        this.state.example.id,
        this.state.validatorAction,
        mode,
        this.state.validator_metadata_io
      )
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
    const inputTargetMetadata = this.state.io_def.input
      .concat(this.state.io_def.target)
      .concat(
        this.state.io_def.metadata.create.filter(
          (io_def_obj) =>
            io_def_obj.model_wrong === undefined ||
            io_def_obj.model_wrong === this.state.example.model_wrong
        )
      )
      .filter(
        (io_def_obj) =>
          ![undefined, null].includes(
            Object.assign(
              {},
              this.state.input_io,
              this.state.target_io,
              this.state.metadata_io
            )[io_def_obj.name]
          )
      )
      .map((io_def_obj) => (
        <div key={io_def_obj.name} className="mb-3">
          <IO
            display_name={io_def_obj.display_name}
            className="name-display-primary"
            key={io_def_obj.name}
            create={false}
            name={io_def_obj.name}
            example_io={Object.assign(
              {},
              this.state.input_io,
              this.state.target_io,
              this.state.metadata_io
            )}
            set_example_io={() => {}}
            type={io_def_obj.type}
            constructor_args={io_def_obj.constructor_args}
          />
        </div>
      ));

    const context = this.state.io_def.context.map((io_def_obj) => (
      <IO
        display_name={io_def_obj.display_name}
        className="name-display-primary"
        key={io_def_obj.name}
        create={false}
        name={io_def_obj.name}
        example_io={this.state.context_io}
        set_example_io={() => {}}
        type={io_def_obj.type}
        constructor_args={io_def_obj.constructor_args}
      />
    ));

    const validatorMetadata = this.state.io_def.metadata.validate
      .filter(
        (io_def_obj) =>
          io_def_obj.validated_as === undefined ||
          io_def_obj.validated_as === this.state.validatorAction
      )
      .map((io_def_obj) => (
        <IO
          display_name={io_def_obj.display_name}
          className="user-input-secondary"
          key={io_def_obj.name}
          create={true}
          name={io_def_obj.name}
          example_io={this.state.validator_metadata_io}
          set_example_io={(example_io) =>
            this.setState({ validator_metadata_io: example_io })
          }
          type={io_def_obj.type}
          constructor_args={io_def_obj.constructor_args}
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
              {!this.state.loading ? (
                this.state.example ? (
                  <>
                    {context && context.length > 0 ? (
                      <div className="mb-1 p-3 rounded light-gray-bg">
                        {context}
                      </div>
                    ) : null}
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          {inputTargetMetadata}
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                            Actions:
                          </h6>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={this.state.validatorAction === "correct"}
                              type="radio"
                              onChange={() =>
                                this.setState({ validatorAction: "correct" })
                              }
                            />
                            <i className="fas fa-thumbs-up"></i> &nbsp;{" "}
                            {this.state.owner_mode ? "Verified " : ""} Correct
                          </InputGroup>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={
                                this.state.validatorAction === "incorrect"
                              }
                              type="radio"
                              onChange={() =>
                                this.setState({ validatorAction: "incorrect" })
                              }
                            />
                            <i className="fas fa-thumbs-down"></i> &nbsp;{" "}
                            {this.state.owner_mode ? "Verified " : ""} Incorrect
                          </InputGroup>
                          {this.state.owner_mode ? null : (
                            <InputGroup className="align-items-center">
                              <Form.Check
                                checked={
                                  this.state.validatorAction === "flagged"
                                }
                                type="radio"
                                onChange={() =>
                                  this.setState({ validatorAction: "flagged" })
                                }
                              />
                              <i className="fas fa-flag"></i> &nbsp; Flag
                            </InputGroup>
                          )}
                          <br />
                          {this.state.validatorAction !== null &&
                          validatorMetadata.length > 0 ? (
                            <>
                              <div>
                                <h6 className="text-uppercase dark-blue-color spaced-header">
                                  You can enter more information:
                                </h6>
                                {validatorMetadata}
                              </div>
                              <br />
                            </>
                          ) : null}
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
                )
              ) : (
                <div className="mx-auto my-3">
                  <Spinner animation="border" />{" "}
                </div>
              )}
              <div className="p-2">
                {this.state.owner_mode ? (
                  <p style={{ color: "red" }}>
                    WARNING: You are in "Task owner mode." You can verify
                    examples as correct or incorrect without input from anyone
                    else!!
                  </p>
                ) : null}
              </div>
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default VerifyInterface;
