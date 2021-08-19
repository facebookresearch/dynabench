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

function initializeIO(ioDict, ioDefObj) {
  if (ioDefObj.type === "target_label") {
    const random =
      ioDefObj.constructor_args.labels[
        Math.floor(Math.random() * ioDefObj.constructor_args.labels.length)
      ];
    ioDict[ioDefObj.name] = random;
  } else {
    ioDict[ioDefObj.name] = null;
  }
}

class VerifyInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskCode: null,
      task: {},
      example: {},
      ownerMode: false,
      ownerValidationFlagFilter: "Any",
      ownerValidationDisagreementFilter: "Any",
      validatorAction: null,
      ioDef: {
        input: [],
        target: [],
        context: [],
        metadata: { create: [], validate: [] },
      },
      inputIO: {},
      targetIO: {},
      contextIO: {},
      metadataIO: {},
      validatorMetadataIO: {},
      loading: true,
    };
    this.getNewExample = this.getNewExample.bind(this);
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
          encodeURIComponent(`/tasks/${params.taskCode}/validate`)
      );
    }

    if (this.context.user.settings_json) {
      const settings = JSON.parse(this.context.user.settings_json);
      if (settings.hasOwnProperty("owner_validation_flag_filter")) {
        this.setState({
          ownerValidationFlagFilter: settings["owner_validation_flag_filter"],
        });
      }
      if (settings.hasOwnProperty("owner_validation_disagreement_filter")) {
        this.setState({
          ownerValidationDisagreementFilter:
            settings["owner_validation_disagreement_filter"],
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
        inputIO: {},
        targetIO: {},
        contextIO: {},
        metadataIO: {},
        validatorMetadataIO: {},
        validatorAction: null,
        loading: true,
      },
      () =>
        (this.state.ownerMode
          ? this.setRangesAndGetRandomFilteredExample()
          : this.context.api.getRandomExample(
              this.state.task.id,
              this.state.task.selected_round
            )
        ).then(
          (result) => {
            const ioDef = JSON.parse(this.state.task.io_def);
            const contextIO = JSON.parse(result.context.context_json);
            const inputIO = JSON.parse(result.input_json);
            const targetIO = JSON.parse(result.target_json);
            const metadataIO = {};
            const metadata = JSON.parse(result.metadata_json);
            for (const ioDefObj of ioDef.metadata.create) {
              if (metadata.hasOwnProperty(ioDefObj.name)) {
                metadataIO[ioDefObj.name] = metadata[ioDefObj.name];
              }
            }
            const validatorMetadataIO = {};
            for (const ioDefObj of ioDef.metadata.validate) {
              initializeIO(validatorMetadataIO, ioDefObj);
            }

            this.setState({
              example: result,
              ioDef: ioDef,
              inputIO: inputIO,
              targetIO: targetIO,
              contextIO: contextIO,
              metadataIO: metadataIO,
              validatorMetadataIO: validatorMetadataIO,
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
    const mode = this.state.ownerMode ? "owner" : "user";
    const filteredValidatorMetadataIO = {};
    for (const ioDefObj of this.state.ioDef.metadata.validate) {
      if (this.state.validatorMetadataIO[ioDefObj.name] !== null) {
        filteredValidatorMetadataIO[ioDefObj.name] =
          this.state.validatorMetadataIO[ioDefObj.name];
      }
    }

    this.context.api
      .validateExample(
        this.state.example.id,
        this.state.validatorAction,
        mode,
        filteredValidatorMetadataIO
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
    var settings;
    if (this.context.user.settings_json) {
      settings = JSON.parse(this.context.user.settings_json);
    } else {
      settings = {};
    }
    settings[key] = value;
    this.context.user.settings_json = JSON.stringify(settings);
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
    const inputTargetMetadata = this.state.ioDef.input
      .concat(this.state.ioDef.target)
      .concat(
        this.state.ioDef.metadata.create.filter(
          (ioDefObj) =>
            ioDefObj.model_wrong_condition === undefined ||
            ioDefObj.model_wrong_condition === this.state.example.model_wrong
        )
      )
      .filter(
        (ioDefObj) =>
          ![undefined, null].includes(
            Object.assign(
              {},
              this.state.inputIO,
              this.state.targetIO,
              this.state.metadataIO
            )[ioDefObj.name]
          )
      )
      .map((ioDefObj) => (
        <div key={ioDefObj.name} className="mb-3">
          <IO
            displayName={ioDefObj.display_name}
            className="name-display-primary"
            key={ioDefObj.name}
            create={false}
            name={ioDefObj.name}
            exampleIO={Object.assign(
              {},
              this.state.inputIO,
              this.state.targetIO,
              this.state.metadataIO
            )}
            setExampleIO={() => {}}
            type={ioDefObj.type}
            constructorArgs={ioDefObj.constructor_args}
          />
        </div>
      ));

    const context = this.state.ioDef.context.map((ioDefObj) => (
      <IO
        displayName={ioDefObj.display_name}
        className="name-display-primary"
        key={ioDefObj.name}
        create={false}
        name={ioDefObj.name}
        exampleIO={this.state.contextIO}
        setExampleIO={() => {}}
        type={ioDefObj.type}
        constructorArgs={ioDefObj.constructor_args}
      />
    ));

    const validatorMetadata = this.state.ioDef.metadata.validate
      .filter(
        (ioDefObj) =>
          ioDefObj.validated_label_condition === undefined ||
          ioDefObj.validated_label_condition === this.state.validatorAction
      )
      .map((ioDefObj) => (
        <IO
          displayName={ioDefObj.display_name}
          className="user-input-secondary"
          key={ioDefObj.name}
          create={true}
          name={ioDefObj.name}
          exampleIO={Object.assign(
            {},
            this.state.validatorMetadataIO,
            this.state.contextIO
          )}
          setExampleIO={(exampleIO) =>
            this.setState({ validatorMetadataIO: exampleIO })
          }
          type={ioDefObj.type}
          constructorArgs={ioDefObj.constructor_args}
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
                      checked={this.state.ownerMode}
                      label="Enter task owner mode?"
                      onChange={() => {
                        this.setState(
                          { ownerMode: !this.state.ownerMode },
                          this.componentDidMount()
                        );
                      }}
                    />
                    {this.state.ownerMode ? (
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
            {this.state.ioDef.content_warning ? (
              <p className="mt-3 p-3 light-red-bg rounded white-color">
                <strong>WARNING</strong>: {this.state.ioDef.content_warning}
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
                            {this.state.ownerMode ? "Verified " : ""} Correct
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
                            {this.state.ownerMode ? "Verified " : ""} Incorrect
                          </InputGroup>
                          {this.state.ownerMode ? null : (
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
                {this.state.ownerMode ? (
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
