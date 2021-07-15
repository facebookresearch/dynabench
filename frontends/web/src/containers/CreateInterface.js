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
  Button,
  Form,
  InputGroup,
  ButtonGroup,
  DropdownButton,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Modal,
  Badge as BBadge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import BootstrapSwitchButton from "bootstrap-switch-button-react";
import {
  OverlayProvider,
  Annotation,
  OverlayContext,
  BadgeOverlay,
} from "./Overlay";
import "./CreateInterface.css";
import IO from "./IO.js";

const Explainer = (props) => (
  <div className="mt-4 mb-1 pt-3">
    <p className="text-uppercase mb-0 spaced-header">
      {props.taskName || <span>&nbsp;</span>}
    </p>
    {props.selectedModel ? (
      <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
        Find examples that fool <i>{props.selectedModel.name}</i>
      </h2>
    ) : (
      <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
        Find examples that fool the model
      </h2>
    )}
  </div>
);

class ResponseInfo extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.retractExample = this.retractExample.bind(this);
    this.flagExample = this.flagExample.bind(this);
    this.state = {
      hide_by_key: new Set(),
    };
  }
  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api.retractExample(this.props.exampleId).then(
      (result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "retracted";
        newContent[idx].retracted = true;
        this.setState({ content: newContent });
      },
      (error) => {
        console.log(error);
      }
    );
  }
  flagExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api.flagExample(this.props.exampleId).then(
      (result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "flagged";
        newContent[idx].flagged = true;
        this.setState({ content: newContent });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  render() {
    let sandboxContent = null;
    if (!this.props.livemode) {
      sandboxContent = (
        <div>
          This example was not stored because you are in sandbox mode.
          {this.context.api.loggedIn() ? (
            ""
          ) : (
            <div>
              <Link
                to={
                  "/register?msg=" +
                  encodeURIComponent(
                    "Please sign up or log in so that you can get credit for your generated examples."
                  ) +
                  "&src=" +
                  encodeURIComponent("/tasks/" + this.props.taskId + "/create")
                }
              >
                Sign up now
              </Link>{" "}
              to make sure your examples are stored and you get credit for your
              examples!
            </div>
          )}
        </div>
      );
    }
    var classNames = this.props.obj.cls + " rounded border m-3";
    var userFeedback = null;
    var submissionResults = null;

    if (this.props.obj.retracted) {
      classNames += " response-warning";
      userFeedback = (
        <span>
          <strong>Example retracted</strong> - thanks.
        </span>
      );
    } else if (this.props.obj.flagged) {
      classNames += " response-warning";
      userFeedback = (
        <span>
          <strong>Example flagged</strong> - thanks.
        </span>
      );
    } else {
      if (this.props.obj.model_correct) {
        classNames += " response-warning";
        submissionResults = (
          <span>
            <strong>You didn't fool the model. Please try again!</strong>
          </span>
        );
      } else {
        classNames += " light-green-bg";
        submissionResults = (
          <span>
            <strong>You fooled the model!</strong>
          </span>
        );
      }
    }

    return (
      <Card className={classNames + " text-center"}>
        <Card.Title>{submissionResults}</Card.Title>
        <Card.Body>
          {Object.keys(this.props.io_definition)
            .filter(
              (key, _) =>
                !this.state.hide_by_key.has(key) &&
                this.props.io_definition[key].location === "input"
            )
            .map((key, _) => (
              <IO
                create={false}
                io_key={key}
                example_io={this.props.obj.example_io}
                set_example_io={() => {}}
                hide_by_key={this.state.hide_by_key}
                set_hide_by_key={(hide_by_key) =>
                  this.setState({ hide_by_key: hide_by_key })
                }
                type={this.props.io_definition[key].type}
                location={this.props.io_definition[key].location}
                constructor_args={
                  this.props.io_definition[key].constructor_args
                }
              />
            ))}
          <Row>
            <Col>
              <BBadge variant="secondary"> Your Output </BBadge>
              {Object.keys(this.props.io_definition)
                .filter(
                  (key, _) =>
                    !this.state.hide_by_key.has(key) &&
                    this.props.io_definition[key].location === "output"
                )
                .map((key, _) => (
                  <IO
                    create={false}
                    io_key={key}
                    example_io={this.props.obj.example_io}
                    set_example_io={() => {}}
                    hide_by_key={this.state.hide_by_key}
                    set_hide_by_key={(hide_by_key) =>
                      this.setState({ hide_by_key: hide_by_key })
                    }
                    type={this.props.io_definition[key].type}
                    location={this.props.io_definition[key].location}
                    constructor_args={
                      this.props.io_definition[key].constructor_args
                    }
                  />
                ))}
              <br />
            </Col>
            <Col>
              <BBadge variant="secondary"> Model Output </BBadge>
              {Object.keys(this.props.io_definition)
                .filter(
                  (key, _) =>
                    !this.state.hide_by_key.has(key) &&
                    (this.props.io_definition[key].location === "output" ||
                      this.props.io_definition[key].location ===
                        "model_response_info")
                )
                .map((key, _) => (
                  <IO
                    create={false}
                    io_key={key}
                    example_io={this.props.obj.model_response_io}
                    set_example_io={() => {}}
                    hide_by_key={this.state.hide_by_key}
                    set_hide_by_key={(hide_by_key) =>
                      this.setState({ hide_by_key: hide_by_key })
                    }
                    type={this.props.io_definition[key].type}
                    location={this.props.io_definition[key].location}
                    constructor_args={
                      this.props.io_definition[key].constructor_args
                    }
                  />
                ))}
              <br />
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={7}>
              <div className="mb-3">{this.props.obj.text}</div>
              <small>
                {userFeedback}
                {sandboxContent}
              </small>
            </Col>
          </Row>
        </Card.Body>
        {this.props.obj.retracted ||
        this.props.obj.flagged ||
        !this.props.livemode ? null : (
          <Card.Footer>
            {
              <div
                className="btn-group"
                role="group"
                aria-label="response actions"
              >
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={(props) => (
                    <Tooltip {...props}>
                      If you made a mistake, you can retract this entry from the
                      dataset.
                    </Tooltip>
                  )}
                >
                  <button
                    data-index={this.props.index}
                    onClick={this.retractExample}
                    type="button"
                    className="btn btn-light btn-sm"
                  >
                    <i className="fas fa-undo-alt"></i> Retract
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={(props) => (
                    <Tooltip {...props}>
                      Something wrong? Flag this example and we will take a
                      look.
                    </Tooltip>
                  )}
                >
                  <button
                    data-index={this.props.index}
                    onClick={this.flagExample}
                    type="button"
                    className="btn btn-light btn-sm"
                  >
                    <i className="fas fa-flag"></i> Flag
                  </button>
                </OverlayTrigger>
              </div>
            }
          </Card.Footer>
        )}
      </Card>
    );
  }
}

class CreateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {},
      context: null,
      content: [],
      retainInput: false,
      livemode: true,
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
      hide_by_key: new Set(),
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.switchLiveMode = this.switchLiveMode.bind(this);
    this.setExampleIO = this.setExampleIO.bind(this);
    this.updateRetainInput = this.updateRetainInput.bind(this);
    this.updateSelectedRound = this.updateSelectedRound.bind(this);
    this.chatContainerRef = React.createRef();
    this.bottomAnchorRef = React.createRef();
    this.inputRef = React.createRef();
    this.setHideByKey = this.setHideByKey.bind(this);
  }

  getNewContext() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.context.api
        .getRandomContext(this.state.taskId, this.state.task.selected_round)
        .then(
          (result) => {
            const randomTargetModel = this.pickModel(this.state.task.round.url);
            const io_definition = JSON.parse(this.state.task.io_definition);
            const context_io = JSON.parse(result.context);
            const example_io = {};
            for (const key in io_definition) {
              example_io[key] = null;
            }
            for (const key in context_io) {
              example_io[key] = context_io[key];
            }
            this.setState({
              randomTargetModel: randomTargetModel,
              context: result,
              content: [{ cls: "context", text: result.context }],
              submitDisabled: false,
              refreshDisabled: false,
              example_io: example_io,
              io_definition: io_definition,
            });
          },
          (error) => {
            console.log(error);
          }
        );
    });
  }

  updateRetainInput(e) {
    const retainInput = e.target.checked;
    if (this.context.api.loggedIn()) {
      var settings_json;
      if (this.context.user.settings_json) {
        settings_json = JSON.parse(this.context.user.settings_json);
        settings_json["retain_input"] = retainInput;
      } else {
        settings_json = { retain_input: retainInput };
      }
      this.context.user.settings_json = JSON.stringify(settings_json);
      this.context.api.updateUser(this.context.user.id, this.context.user);
    }
    this.setState({ retainInput: retainInput });
  }

  updateSelectedRound(e) {
    const selected = parseInt(e.target.getAttribute("index"));
    if (selected !== this.state.task.selected_round) {
      this.context.api.getTaskRound(this.state.task.id, selected).then(
        (result) => {
          var task = { ...this.state.task };
          task.round = result;
          task.selected_round = selected;
          this.setState({ task: task }, function () {
            this.getNewContext();
          });
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }

  pickModel = (modelUrls) => {
    const models = modelUrls.split("|");
    const model = models[Math.floor(Math.random() * models.length)];
    return model;
  };

  manageTextInput = (action) => {
    if (this.inputRef.current) {
      if (action === "focus") {
        this.inputRef.current.focus();
      } else if (action === "blur") {
        this.inputRef.current.blur();
      }
    }
  };

  instantlyScrollToBottom() {
    setTimeout(() => {
      if (this.chatContainerRef.current)
        this.chatContainerRef.current.scrollTop = this.chatContainerRef.current.scrollHeight;
    }, 0);
  }

  smoothlyAnimateToBottom() {
    if (this.bottomAnchorRef.current) {
      this.bottomAnchorRef.current.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }
  }

  handleResponse(e) {
    e.preventDefault();
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.manageTextInput("blur");
      this.context.api
        .getModelResponse(
          this.state.selectedModel
            ? this.state.selectedModel.endpointUrl
            : this.state.randomTargetModel,
          this.state.example_io
        )
        .then(
          (model_response_result) => {
            if (model_response_result.errorMessage) {
              this.setState({
                submitDisabled: false,
                refreshDisabled: false,
                fetchPredictionError: true,
              });
            } else {
              if (this.state.fetchPredictionError) {
                this.setState({
                  fetchPredictionError: false,
                });
              }
              this.smoothlyAnimateToBottom();
              // Save examples.
              if (!this.state.livemode) {
                // We are in sandbox.
                this.setState({
                  submitDisabled: false,
                  refreshDisabled: false,
                });
                return;
              }
              const metadata = { model: this.state.randomTargetModel };
              this.context.api
                .storeExample(
                  this.state.task.id,
                  this.state.task.selected_round,
                  this.context.user.id,
                  this.state.context.id,
                  this.state.example_io,
                  model_response_result,
                  metadata,
                  null,
                  this.state.randomTargetModel.split("predict?model=")[1]
                )
                .then(
                  (store_example_result) => {
                    var key = this.state.content.length;
                    // Reset state variables and store example id.
                    this.setState({
                      submitDisabled: false,
                      refreshDisabled: false,
                      mapKeyToExampleId: {
                        ...this.state.mapKeyToExampleId,
                        [key]: store_example_result.id,
                      },
                      content: [
                        ...this.state.content,
                        {
                          model_correct: store_example_result.model_correct,
                          example_io: JSON.parse(
                            JSON.stringify(this.state.example_io)
                          ),
                          model_response_io: model_response_result,
                          url: this.state.randomTargetModel,
                          retracted: false,
                        },
                      ],
                    });

                    if (!!store_example_result.badges) {
                      this.setState({
                        showBadges: store_example_result.badges,
                      });
                    }
                  },
                  (error) => {
                    console.log(error);
                    this.setState({
                      submitDisabled: false,
                      refreshDisabled: false,
                    });
                  }
                );
            }
          },
          (error) => {
            console.log(error);
            if (error && error.message && error.message === "Unauthorized") {
              this.props.history.push(
                "/login?msg=" +
                  encodeURIComponent("You need to login to use this feature.") +
                  "&src=" +
                  encodeURIComponent("/tasks/" + this.state.taskId + "/create")
              );
            }
            this.setState({
              submitDisabled: false,
              refreshDisabled: false,
            });
          }
        );
    });
  }

  switchLiveMode(checked) {
    if (checked === true && !this.context.api.loggedIn()) {
      this.props.history.push(
        "/register?msg=" +
          encodeURIComponent(
            "Please sign up or log in so that you can get credit for your generated examples."
          ) +
          "&src=" +
          encodeURIComponent("/tasks/" + this.state.taskId + "/create")
      );
    }
    this.setState({ livemode: checked });
  }

  componentDidMount() {
    const propState = this.props.location.state;
    this.setState({
      selectedModel: propState?.detail,
    });
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.context.api.getTrialAuthToken();
    }
    if (!this.context.api.loggedIn() || propState?.detail) {
      this.setState({ livemode: false });
    } else {
      const user = this.context.api.getCredentials();
      this.context.api.getUser(user.id, true).then(
        (result) => {
          if (result.settings_json) {
            var settings_json = JSON.parse(result.settings_json);
            if (settings_json["retain_input"]) {
              this.setState({ retainInput: settings_json["retain_input"] });
            }
          }
        },
        (error) => {
          console.log(error);
        }
      );
    }

    this.setState({ taskId: params.taskId }, function () {
      this.context.api.getTask(this.state.taskId).then(
        (result) => {
          this.setState({ task: result }, function () {
            this.state.task.selected_round = this.state.task.cur_round;
            this.getNewContext();
          });
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

  updateAnswer(value) {
    // Only keep the last answer annotated
    if (value.length > 0) {
      this.setState({
        answer: [value[value.length - 1]],
        answerNotSelected: false,
      });
    } else {
      this.setState({ answer: value, answerNotSelected: false });
    }
  }

  setExampleIO(example_io) {
    this.setState({ example_io: example_io });
  }

  setHideByKey(hide_by_key) {
    this.setState({ hide_by_key: hide_by_key });
  }

  render() {
    const responseContent = this.state.content
      .map((item, index) =>
        item.cls === "context" ? undefined : (
          <ResponseInfo
            io_definition={this.state.io_definition}
            key={index}
            index={index}
            exampleId={this.state.mapKeyToExampleId[index]}
            livemode={this.state.livemode}
            obj={item}
            content={this.state.content}
          />
        )
      )
      .filter((item) => item !== undefined);
    // sentinel value of undefined filtered out after to preserve index values
    const rounds = (this.state.task.round && this.state.task.cur_round) || 0;
    const roundNavs = [];
    for (let i = rounds; i > 0; i--) {
      let cur = "";
      let active = false;
      if (i === this.state.task.cur_round) {
        cur = " (active)";
      }
      if (i === this.state.task.selected_round) {
        active = true;
      }
      roundNavs.push(
        <Dropdown.Item
          key={i}
          index={i}
          onClick={this.updateSelectedRound}
          active={active}
        >
          Round {i}
          {cur}
        </Dropdown.Item>
      );
      if (i === this.state.task.cur_round) {
        roundNavs.push(<Dropdown.Divider key={"div" + i} />);
      }
    }

    function renderTooltip(props, text) {
      return (
        <Tooltip id="button-tooltip" {...props}>
          {text}
        </Tooltip>
      );
    }
    function renderSandboxTooltip(props) {
      return renderTooltip(props, "Switch in and out of sandbox mode.");
    }
    function renderSwitchRoundTooltip(props) {
      return renderTooltip(
        props,
        "Switch to other rounds of this task, including no longer active ones."
      );
    }
    function renderSwitchContextTooltip(props) {
      return renderTooltip(props, "Don't like this context? Try another one.");
    }

    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <Container className="mb-5 pb-5">
          <Col className="m-auto" lg={12}>
            <div style={{ float: "right" }}>
              <ButtonGroup>
                <Annotation
                  placement="left"
                  tooltip="Click to show help overlay"
                >
                  <OverlayContext.Consumer>
                    {({ hidden, setHidden }) => (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-help-info"
                        onClick={() => {
                          setHidden(!hidden);
                        }}
                      >
                        <i className="fas fa-question"></i>
                      </button>
                    )}
                  </OverlayContext.Consumer>
                </Annotation>
                <Annotation
                  placement="bottom"
                  tooltip="Click to learn more details about this task challenge"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showInfoModal: true });
                    }}
                  >
                    <i className="fas fa-info"></i>
                  </button>
                </Annotation>
                <Annotation
                  placement="top"
                  tooltip="Click to adjust your create settings"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showCreateSettingsModal: true });
                    }}
                  >
                    <i className="fa fa-cog"></i>
                  </button>
                </Annotation>
              </ButtonGroup>
              <Modal
                show={this.state.showInfoModal}
                onHide={() => this.setState({ showInfoModal: false })}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Instructions</Modal.Title>
                </Modal.Header>
                <Modal.Body>{this.state.task.create_instructions}</Modal.Body>
              </Modal>
              <Modal
                show={this.state.showCreateSettingsModal}
                onHide={() => this.setState({ showCreateSettingsModal: false })}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Create Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Check
                    checked={this.state.retainInput}
                    label="Do you want to retain your input for the same context?"
                    onChange={this.updateRetainInput}
                  />
                </Modal.Body>
              </Modal>
            </div>
            <Explainer
              taskName={this.state.task.name}
              selectedModel={this.state.selectedModel}
            />
            <Card>
              <Card.Body
                style={{ height: "auto", width: "auto" }}
                ref={this.chatContainerRef}
              >
                {this.state.io_definition && this.state.example_io
                  ? Object.keys(this.state.io_definition)
                      .filter(
                        (key, _) =>
                          !this.state.hide_by_key.has(key) &&
                          this.state.io_definition[key].location !==
                            "model_response_info"
                      )
                      .map((key, _) => (
                        <Row>
                          <IO
                            create={true}
                            io_key={key}
                            example_io={this.state.example_io}
                            set_example_io={this.setExampleIO}
                            hide_by_key={this.state.hide_by_key}
                            set_hide_by_key={(hide_by_key) => {
                              this.setState({ hide_by_key: hide_by_key });
                              console.log(this.state.hide_by_key);
                            }}
                            type={this.state.io_definition[key].type}
                            location={this.state.io_definition[key].location}
                            constructor_args={
                              this.state.io_definition[key].constructor_args
                            }
                          />
                        </Row>
                      ))
                  : null}
                {responseContent}
                <div className="bottom-anchor" ref={this.bottomAnchorRef} />
              </Card.Body>
              <Form>
                <Row className="p-3">
                  <Col xs={6}>
                    <InputGroup>
                      {this.state.selectedModel ? (
                        ""
                      ) : (
                        <OverlayTrigger
                          placement="bottom"
                          delay={{ show: 250, hide: 400 }}
                          overlay={renderSandboxTooltip}
                        >
                          <span style={{ marginRight: 10 }}>
                            <Annotation
                              placement="left"
                              tooltip="If you want to just play around without storing your examples, you can switch to Sandbox mode here."
                            >
                              <BootstrapSwitchButton
                                checked={this.state.livemode}
                                onlabel="Live Mode"
                                onstyle="primary blue-bg"
                                offstyle="warning"
                                offlabel="Sandbox"
                                width={120}
                                onChange={(checked) => {
                                  this.switchLiveMode(checked);
                                }}
                              />
                            </Annotation>
                          </span>
                        </OverlayTrigger>
                      )}

                      {this.state.task.cur_round > 1 ? (
                        <OverlayTrigger
                          placement="bottom"
                          delay={{ show: 250, hide: 400 }}
                          overlay={renderSwitchRoundTooltip}
                        >
                          <Annotation
                            placement="right"
                            tooltip="Want to try talking to previous rounds? You can switch here."
                          >
                            <DropdownButton
                              variant="light"
                              className="border-0 blue-color font-weight-bold light-gray-bg"
                              style={{ marginRight: 10 }}
                              id="dropdown-basic-button"
                              title={
                                "Round " +
                                this.state.task.selected_round +
                                (this.state.task.selected_round ===
                                this.state.task.cur_round
                                  ? " (active)"
                                  : "")
                              }
                            >
                              {roundNavs}
                            </DropdownButton>
                          </Annotation>
                        </OverlayTrigger>
                      ) : null}
                    </InputGroup>
                  </Col>
                  <Col xs={6}>
                    <InputGroup className="d-flex justify-content-end">
                      <OverlayTrigger
                        placement="bottom"
                        delay={{ show: 250, hide: 400 }}
                        overlay={renderSwitchContextTooltip}
                      >
                        <Annotation
                          placement="left"
                          tooltip="Don’t like this context, or this goal label? Try another one."
                        >
                          <Button
                            className="font-weight-bold blue-color light-gray-bg border-0 task-action-btn"
                            onClick={this.getNewContext}
                            disabled={this.state.refreshDisabled}
                          >
                            Switch to next context
                          </Button>
                        </Annotation>
                      </OverlayTrigger>
                      <Annotation
                        placement="top"
                        tooltip="When you’re done, you can submit the example and we’ll find out what the model thinks!"
                      >
                        <Button
                          type="submit"
                          className="font-weight-bold blue-bg border-0 task-action-btn"
                          onClick={this.handleResponse}
                          disabled={this.state.submitDisabled}
                        >
                          {"Submit "}
                          <i
                            className={
                              this.state.submitDisabled
                                ? "fa fa-cog fa-spin"
                                : ""
                            }
                          />
                        </Button>
                      </Annotation>
                    </InputGroup>
                  </Col>
                </Row>
              </Form>
              <div className="p-2">
                {this.state.task.cur_round !== this.state.task.selected_round &&
                !this.state.selectedModel ? (
                  <p style={{ color: "red" }}>
                    WARNING: You are talking to an outdated model for a round
                    that is no longer active. Examples you generate may be less
                    useful.
                  </p>
                ) : (
                  ""
                )}
                {!this.state.livemode ? (
                  <p style={{ color: "red" }}>
                    WARNING: You are in "just playing" sandbox mode. Your
                    examples are not saved.
                  </p>
                ) : (
                  ""
                )}
                {this.state.selectedModel ? (
                  <p style={{ color: "red" }}>
                    WARNING: You are talking to a user-uploaded model. You
                    cannot switch out of sandbox mode.
                  </p>
                ) : (
                  ""
                )}

                {this.state.answerNotSelected === true
                  ? "*Please select an answer in the context"
                  : null}
                {this.state.fetchPredictionError && (
                  <span style={{ color: "#e65959" }}>
                    *Unable to fetch results. Please try again after sometime.
                  </span>
                )}
              </div>
            </Card>
          </Col>
          {this.state.task.type === "VQA" && (
            <KeyboardShortcuts
              allowedShortcutsInText={["escape"]}
              mapKeyToCallback={{
                i: {
                  callback: (action) => this.manageTextInput(action),
                  params: "focus",
                },
                escape: {
                  callback: (action) => this.manageTextInput(action),
                  params: "blur",
                },
                d: {
                  callback: () => {
                    if (!this.state.refreshDisabled) {
                      this.getNewContext();
                    }
                  },
                },
              }}
            />
          )}
        </Container>
      </OverlayProvider>
    );
  }
}

export default CreateInterface;
