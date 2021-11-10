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
import UserContext from "../../../src/containers/UserContext";
import {
  OverlayProvider,
  BadgeOverlay,
  Annotation,
} from "../../../src/containers/Overlay";
import AnnotationComponent from "../../../src/common/Annotation/AnnotationComponent.js";
import initializeData from "../../../src/common/Annotation/InitializeAnnotationData.js";

class ValidateInterface extends React.Component {
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
      annotationConfig: null,
      data: {},
      loading: true,
      admin_or_owner: false,
      examplesSubmitted: 0,
      batchAmount: 10,
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
    this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    this.context.api = this.props.api ? this.props.api : this.context.api
    if (!this.context.api.loggedIn() && !this.props.mturk) {
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
              this.context.api
                .getAdminOrOwner(this.state.task.id)
                .then((result) => {
                  this.setState({ admin_or_owner: result.admin_or_owner });
                });
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

  handleTaskSubmit() {
    this.props.onSubmit(this.state);
  }

  getNewExample() {
    this.setState(
      {
        validatorAction: null,
        loading: true,
      },
      () =>
        (this.state.ownerMode
          ? this.setRangesAndGetRandomFilteredExample()
          : this.context.api.getRandomExample(
              this.state.task.id,
              this.state.task.selected_round,
              [],
              [],
              this.props.mturk ? this.props.providerWorkerId : null,
            )
        ).then(
          (result) => {
            const annotationConfig = JSON.parse(
              this.state.task.annotation_config_json
            );
            const context = JSON.parse(result.context.context_json);
            const input = JSON.parse(result.input_json);
            const createMetadata = JSON.parse(result.metadata_json);
            const validateMetadata = initializeData(
              annotationConfig.metadata.validate
            );
            this.setState({
              example: result,
              annotationConfig: annotationConfig,
              data: Object.assign(
                {},
                input,
                createMetadata,
                context,
                validateMetadata
              ),
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
    const filteredValidatorMetadata = this.props.mturk ? {
      annotator_id: this.props.providerWorkerId,
      mephisto_id: this.props.mephistoWorkerId,
      agentId: this.props.agentId,
      assignmentId: this.props.assignmentId,
    } : {};
    for (const annotationConfigObj of this.state.annotationConfig.metadata
      .validate) {
      if (this.state.data[annotationConfigObj.name] !== null) {
        filteredValidatorMetadata[annotationConfigObj.name] =
          this.state.data[annotationConfigObj.name];
      }
    }
    console.log("yo")
    console.log(this.state.examplesSubmitted)

    this.context.api
      .validateExample(
        this.state.example.id,
        this.state.validatorAction,
        mode,
        filteredValidatorMetadata,
        this.props.mturk ? this.props.providerWorkerId : null
      )
      .then(
        (result) => {
          console.log("yo")
          console.log(this.state.examplesSubmitted)
          this.setState({examplesSubmitted: this.state.examplesSubmitted + 1},
          this.getNewExample());
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
    const inputMetadataInterface = this.state.annotationConfig?.input
      .concat(
        this.state.annotationConfig.metadata.create.filter(
          (annotationConfigObj) =>
            annotationConfigObj.model_wrong_condition === undefined ||
            annotationConfigObj.model_wrong_condition ===
              this.state.example.model_wrong
        )
      )
      .filter(
        (annotationConfigObj) =>
          ![undefined, null].includes(this.state.data[annotationConfigObj.name])
      )
      .map((annotationConfigObj) => (
        <div key={annotationConfigObj.name} className="mb-1 mt-1">
          <AnnotationComponent
            displayName={annotationConfigObj.display_name}
            className="name-display-primary"
            key={annotationConfigObj.name}
            name={annotationConfigObj.name}
            data={this.state.data}
            type={annotationConfigObj.type}
            constructorArgs={annotationConfigObj.constructor_args}
          />
        </div>
      ));

    const contextInterface = this.state.annotationConfig?.context.map(
      (annotationConfigObj) => (
        <div key={annotationConfigObj.name} className="mb-3 mt-3">
          <AnnotationComponent
            displayName={annotationConfigObj.display_name}
            className="name-display-primary"
            key={annotationConfigObj.name}
            name={annotationConfigObj.name}
            data={this.state.data}
            type={annotationConfigObj.type}
            constructorArgs={annotationConfigObj.constructor_args}
          />
        </div>
      )
    );

    const validatorMetadataInterface =
      this.state.annotationConfig?.metadata.validate
        ?.filter(
          (annotationConfigObj) =>
            annotationConfigObj.validated_label_condition === undefined ||
            annotationConfigObj.validated_label_condition ===
              this.state.validatorAction
        )
        .map((annotationConfigObj) => (
          <div key={annotationConfigObj.name} className="mb-1 mt-1">
            <AnnotationComponent
              displayName={annotationConfigObj.display_name}
              className="user-input-secondary"
              key={annotationConfigObj.name}
              create={true}
              name={annotationConfigObj.name}
              data={this.state.data}
              setData={(data) => this.setState({ data: data })}
              type={annotationConfigObj.type}
              constructorArgs={annotationConfigObj.constructor_args}
            />
          </div>
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
          {this.state.examplesSubmitted > this.state.batchAmount ?
           (
            <>
              <p>Thank you for completing the HIT. You may now submit it by clicking below:</p>
              <p>
                <Button
                  className="btn btn-primary btn-primary mt-2 py-2"
                  onClick={this.handleTaskSubmit}
                >
                  Submit HIT
                </Button>
              </p>
            </>
          ) : ( <>
            <Modal
              show={!!this.props.warning}
              onHide={() => {this.props.setWarning(null)}}
            >
              <Modal.Header closeButton>
                <Modal.Title><p style={{ color: "red" }}>
                  {this.props.warning}
                </p></Modal.Title>
              </Modal.Header>
            </Modal>
            {this.state.admin_or_owner && (
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
                    {this.state.ownerMode && (
                      <div>
                        <DropdownButton
                          variant="light"
                          className="p-1"
                          title={
                            this.state.ownerValidationFlagFilter.toString() +
                            " flag" +
                            (this.state.ownerValidationFlagFilter !== 1
                              ? "s"
                              : "")
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
                            (this.state.ownerValidationDisagreementFilter !== 1
                              ? "s"
                              : "")
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
                    )}
                  </Modal.Body>
                </Modal>
              </div>
            )}
            <div className="mt-4 pt-3">
              <p className="text-uppercase mb-0 spaced-header">
                {this.state.task.name}
              </p>
              <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
                Validate examples
              </h2>
            </div>
            {this.state.annotationConfig?.content_warning && (
              <p className="mt-3 p-3 light-red-bg rounded white-color">
                <strong>WARNING</strong>:{" "}
                {this.state.annotationConfig.content_warning}
              </p>
            )}
            <Card className="profile-card">
              {!this.state.loading ? (
                this.state.example ? (
                  <>
                    {contextInterface && contextInterface.length > 0 && (
                      <div className="mb-1 p-3 rounded light-gray-bg">
                        <strong>Instructions:</strong> Select whether the image matches the caption. Pay close attention to the word order.
                        {contextInterface}
                      </div>
                    )}
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          {inputMetadataInterface}
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                            Does the caption match the image?
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
                            {this.state.ownerMode && "Verified "} Yes
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
                            {this.state.ownerMode && "Verified "} No
                          </InputGroup>
                          {false && !this.state.ownerMode && (
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
                            validatorMetadataInterface.length > 0 && (
                              <>
                                <div>
                                  <h6 className="text-uppercase dark-blue-color spaced-header">
                                    You can enter more information:
                                  </h6>
                                  {validatorMetadataInterface}
                                </div>
                                <br />
                              </>
                            )}
                        </Col>
                      </Row>
                      <InputGroup className="align-items-center">
                        <Button
                          type="button"
                          disabled={!this.state.validatorAction}
                          className="font-weight-bold blue-bg border-0 task-action-btn"
                          onClick={() => this.handleResponse()}
                        >
                          {" "}
                          Submit{" "}
                        </Button>
                        {false &&
                        <Button
                          data-index={this.props.index}
                          onClick={this.getNewExample}
                          type="button"
                          className="font-weight-bold blue-color light-gray-bg border-0 task-action-btn"
                        >
                          <i className="fas fa-undo-alt"></i> Skip and load new
                          example
                        </Button>}
                      </InputGroup>
                    </Card.Body>
                  </>
                ) : (
                  <Card.Body className="p-3">
                    <Row>
                    <Col lg={12}>
                      {this.state.examplesSubmitted > 0 ? (
                        <>
                          <p>There are no more examples to be validated!</p>
                          <p>Thank you for completing the HIT. You may now submit it by clicking below:</p>
                          <p>
                            <Button
                              className="btn btn-primary btn-success mt-2 py-2"
                              onClick={this.handleTaskSubmit}
                            >
                              Submit HIT
                            </Button>
                          </p>
                        </>
                      ) : (
                          <>
                            <p>Sorry, there are currently no examples for validation.</p>
                            <p>We may have more examples ready for validation in the coming days. Thank you for your patience.</p>
                          </>
                      )}
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
                {this.state.ownerMode && (
                  <p style={{ color: "red" }}>
                    WARNING: You are in "Task owner mode." You can verify
                    examples as correct or incorrect without input from anyone
                    else!!
                  </p>
                )}
              </div>
            </Card></>)}
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default ValidateInterface;
