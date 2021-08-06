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
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import BootstrapSwitchButton from "bootstrap-switch-button-react";
import {
  OverlayProvider,
  Annotation,
  OverlayContext,
  BadgeOverlay,
} from "./Overlay";
import Markdown from "react-markdown";
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
    this.updateUserMetadataIO = this.updateUserMetadataIO.bind(this);
    this.updateModelWrong = this.updateModelWrong.bind(this);
    this.state = {
      user_metadata_io: {},
      model_wrong: this.props.obj.model_wrong,
    };
  }
  componentDidMount() {
    const user_metadata_io = {};
    (this.state.model_wrong
      ? this.props.user_metadata_model_wrong_io_def
      : this.props.user_metadata_model_correct_io_def
    ).forEach((io_obj) => {
      user_metadata_io[io_obj.name] = null;
    });
    this.setState({
      user_metadata_io: user_metadata_io,
      exampleUpdated: null,
      feedbackSaved: null,
    });
  }

  updateUserMetadataIO() {
    const non_null_user_metadata_io = {};
    (this.state.model_wrong
      ? this.props.user_metadata_model_wrong_io_def
      : this.props.user_metadata_model_correct_io_def
    ).forEach((io_obj) => {
      if (this.state.user_metadata_io[io_obj.name] !== null) {
        non_null_user_metadata_io[io_obj.name] = this.state.user_metadata_io[
          io_obj.name
        ];
      }
    });
    this.context.api
      .updateExample(this.props.exampleId, {
        user_metadata_io: non_null_user_metadata_io,
      })
      .then(
        (result) => {},
        (error) => {
          console.log(error);
        }
      );
  }

  updateModelWrong(model_wrong) {
    if (this.props.obj.livemode) {
      this.context.api
        .updateExample(this.props.exampleId, {
          model_wrong: model_wrong,
        })
        .then(
          (result) => this.setState({ model_wrong: model_wrong }),
          (error) => {
            console.log(error);
          }
        );
    } else {
      this.setState({ model_wrong: model_wrong });
    }
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
    if (!this.props.obj.livemode) {
      sandboxContent = (
        <div className="mt-3">
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
                  encodeURIComponent(`/tasks/${this.props.taskCode}/create`)
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

    const userInput = this.props.input_io_def.map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={false}
        name={io_obj.name}
        example_io={this.props.obj.example_io}
        set_example_io={() => {}}
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

    const userOutput = this.props.output_io_def.map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={false}
        name={io_obj.name}
        example_io={this.props.obj.example_io}
        set_example_io={() => {}}
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

    const modelOutput = this.props.output_io_def.map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={false}
        name={io_obj.name}
        example_io={this.props.obj.model_response_io}
        set_example_io={() => {}}
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

    const modelMetadata = this.props.model_metadata_io_def.map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={false}
        name={io_obj.name}
        example_io={this.props.obj.model_response_io}
        set_example_io={() => {}}
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

    const userMetadata = (this.state.model_wrong
      ? this.props.user_metadata_model_wrong_io_def
      : this.props.user_metadata_model_correct_io_def
    ).map((io_obj, _) => (
      <IO
        key={io_obj.name}
        create={true}
        name={io_obj.name}
        example_io={this.state.user_metadata_io}
        set_example_io={(example_io) =>
          this.setState({ user_metadata_io: example_io, exampleUpdated: false })
        }
        type={io_obj.type}
        constructor_args={io_obj.constructor_args}
      />
    ));

    var classNames = this.props.obj.cls + " rounded border m-3";

    const submissionResults = (
      <Row>
        <Col>The model predicted </Col>
        <Col>
          <strong>{modelOutput}</strong>
        </Col>
        <Col>and you say</Col>
        <Col>
          <strong>{userOutput}</strong>
        </Col>
      </Row>
    );

    var userFeedback = (
      <>
        {this.props.obj.livemode ? (
          this.state.model_wrong !== null ? (
            <div className="mt-3">
              <span>Optionally, enter more info for your example:</span>
              {this.state.exampleUpdated ? (
                <span style={{ float: "right" }}> Saved! </span>
              ) : (
                <button
                  onClick={() => {
                    this.updateUserMetadataIO();
                    this.setState({ exampleUpdated: true });
                  }}
                  type="button"
                  style={{ float: "right" }}
                  className="btn btn-light btn-sm"
                >
                  Save Info
                </button>
              )}
              {userMetadata}
            </div>
          ) : (
            ""
          )
        ) : (
          ""
        )}
      </>
    );

    var title = null;
    if (this.props.obj.retracted) {
      classNames += " response-warning";
      userFeedback = null;
      title = (
        <span>
          <strong>Example retracted</strong> - thanks
        </span>
      );
    } else if (this.props.obj.flagged) {
      classNames += " response-warning";
      userFeedback = null;
      title = (
        <span>
          <strong>Example flagged</strong> - thanks
        </span>
      );
    } else {
      if (this.state.model_wrong === null) {
        classNames += " light-gray-bg";
        title = (
          <span>
            <strong>Is the model also correct?</strong>{" "}
            <div className="btn-group" role="group" aria-label="model wrong">
              <button
                data-index={this.props.index}
                onClick={() => this.updateModelWrong(false)}
                type="button"
                className="btn btn-primary btn-sm"
              >
                Yes
              </button>
              <button
                data-index={this.props.index}
                onClick={() => this.updateModelWrong(true)}
                type="button"
                className="btn btn-primary btn-sm"
              >
                No
              </button>
            </div>
          </span>
        );
      } else {
        if (this.state.model_wrong) {
          classNames += " light-green-bg";
          title = (
            <span>
              <strong>You fooled the model!</strong>
            </span>
          );
        } else {
          classNames += " response-warning";
          title = (
            <span>
              <strong>You didn't fool the model. Please try again!</strong>
            </span>
          );
        }
      }
    }

    return (
      <Card className={classNames} style={{ minHeight: 120 }}>
        <Card.Body className="p-3">
          <Row>
            <Col xs={12} md={7}>
              <div className="mb-3">{title}</div>
              <div className="mb-3">{userInput}</div>
              <small>
                {submissionResults}
                {userFeedback}
                {sandboxContent}
              </small>
            </Col>
            <Col xs={12} md={5}>
              {modelMetadata}
            </Col>
          </Row>
        </Card.Body>
        {this.props.obj.retracted ||
        this.props.obj.flagged ||
        !this.props.obj.livemode ? null : (
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
      taskCode: null,
      task: {},
      context: null,
      content: [],
      retainInput: false,
      livemode: true,
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
      submitWithoutFullExample: false,
      input_io_def: [],
      output_io_def: [],
      context_io_def: [],
      model_metadata_io_def: [],
      user_metadata_model_correct_io_def: [],
      user_metadata_model_wrong_io_def: [],
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.switchLiveMode = this.switchLiveMode.bind(this);
    this.updateRetainInput = this.updateRetainInput.bind(this);
    this.updateSelectedRound = this.updateSelectedRound.bind(this);
    this.chatContainerRef = React.createRef();
    this.bottomAnchorRef = React.createRef();
    this.inputRef = React.createRef();
  }

  getNewContext() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.context.api
        .getRandomContext(this.state.task.id, this.state.task.selected_round)
        .then(
          (result) => {
            const randomTargetModel = this.pickModel(this.state.task.round.url);
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
            const context_io = JSON.parse(result.context_io);
            const example_io = {};
            input_io_def.concat(output_io_def).forEach((io_obj) => {
              example_io[io_obj.name] = null;
            });
            for (const key in context_io) {
              example_io[key] = context_io[key];
            }
            this.setState({
              randomTargetModel: randomTargetModel,
              context: result,
              content: [{ cls: "context" }],
              submitDisabled: false,
              refreshDisabled: false,
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
    var incomplete_example = false;
    this.state.input_io_def
      .concat(this.state.output_io_def)
      .forEach((io_obj) => {
        if (this.state.example_io[io_obj.name] === null) {
          this.setState({ submitWithoutFullExample: true });
          incomplete_example = true;
        }
      });
    if (incomplete_example) {
      return;
    }

    this.setState({ submitWithoutFullExample: false });
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.manageTextInput("blur");
      const url = this.state.selectedModel
        ? this.state.selectedModel.endpointUrl
        : this.state.randomTargetModel;
      const endpoint = url.split("predict?model=")[1];

      // Begin hack that can be removed upon full dynalab integration
      if (
        !endpoint.startsWith("ts") &&
        (this.state.task.task_code === "hs" ||
          this.state.task.task_code === "sentiment")
      ) {
        this.state.example_io["hypothesis"] = this.state.example_io[
          "statement"
        ];
      }
      if (!endpoint.startsWith("ts") && this.state.task.task_code === "qa") {
        this.state.example_io["hypothesis"] = this.state.example_io["question"];
      }
      // End hack that can be removed upon full dynalab integration

      this.context.api.getModelResponse(url, this.state.example_io).then(
        (model_response_result) => {
          // Begin hack that can be removed upon full dynalab integration
          if (
            !endpoint.startsWith("ts") &&
            this.state.task.task_code === "hs"
          ) {
            model_response_result["label"] =
              model_response_result["prob"][0] >
              model_response_result["prob"][1]
                ? "not-hateful"
                : "hateful";
            model_response_result["prob"] = {
              "not-hateful": model_response_result["prob"][0],
              hateful: model_response_result["prob"][1],
            };
          }
          if (
            !endpoint.startsWith("ts") &&
            this.state.task.task_code === "sentiment"
          ) {
            model_response_result["label"] =
              model_response_result["prob"][0] >
                model_response_result["prob"][1] &&
              model_response_result["prob"][0] >
                model_response_result["prob"][2]
                ? "negative"
                : model_response_result["prob"][1] >
                  model_response_result["prob"][2]
                ? "positive"
                : "neutral";
            model_response_result["prob"] = {
              negative: model_response_result["prob"][0],
              positive: model_response_result["prob"][1],
              neutral: model_response_result["prob"][2],
            };
          }
          if (
            !endpoint.startsWith("ts") &&
            this.state.task.task_code === "nli"
          ) {
            model_response_result["label"] =
              model_response_result["prob"][0] >
                model_response_result["prob"][1] &&
              model_response_result["prob"][0] >
                model_response_result["prob"][2]
                ? "entailed"
                : model_response_result["prob"][1] >
                  model_response_result["prob"][2]
                ? "neutral"
                : "contradictory";
            model_response_result["prob"] = {
              entailed: model_response_result["prob"][0],
              neutral: model_response_result["prob"][1],
              contradictory: model_response_result["prob"][2],
            };
          }
          if (
            !endpoint.startsWith("ts") &&
            this.state.task.task_code === "qa"
          ) {
            model_response_result["answer"] = model_response_result["text"];
            model_response_result["conf"] = model_response_result["prob"];
          }
          // End hack that can be removed upon full dynalab integration

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

            const user_output_io = Object.assign(
              {},
              ...this.state.output_io_def.map((io_obj, _) => ({
                [io_obj.name]: this.state.example_io[io_obj.name],
              }))
            );
            const model_output_io = JSON.parse(
              JSON.stringify(model_response_result)
            ); // TODO: this needs to be more than what is in the io definition, for old non-dynalab signature verification to work. This can be changed when full dynalab integration is done
            const input_io = Object.assign(
              {},
              ...this.state.input_io_def.map((io_obj, _) => ({
                [io_obj.name]: this.state.example_io[io_obj.name],
              }))
            );
            const model_metadata_io = Object.assign(
              {},
              ...this.state.model_metadata_io_def.map((io_obj, _) => ({
                [io_obj.name]: model_response_result[io_obj.name],
              }))
            );
            const metadata = { model: this.state.randomTargetModel };
            this.context.api
              .getModelWrong(
                this.state.task.id,
                user_output_io,
                model_output_io
              )
              .then(
                (model_wrong_result) => {
                  this.setState({
                    content: [
                      ...this.state.content,
                      {
                        livemode: this.state.livemode,
                        model_wrong: model_wrong_result.model_wrong,
                        example_io: JSON.parse(
                          JSON.stringify(this.state.example_io)
                        ),
                        model_response_io: model_response_result,
                        url: this.state.randomTargetModel,
                        retracted: false,
                      },
                    ],
                  });

                  if (!this.state.livemode) {
                    if (!this.state.retainInput) {
                      const example_io = JSON.parse(
                        JSON.stringify(this.state.example_io)
                      );
                      this.state.input_io_def
                        .concat(this.state.output_io_def)
                        .forEach((io_obj) => {
                          example_io[io_obj.name] = null;
                        });
                      this.setState({ example_io: example_io });
                    }
                    this.setState({
                      submitDisabled: false,
                      refreshDisabled: false,
                    });
                    return;
                  }

                  // Save examples.
                  this.context.api
                    .storeExample(
                      this.state.task.id,
                      this.state.task.selected_round,
                      this.context.user.id,
                      this.state.context.id,
                      input_io,
                      user_output_io,
                      model_output_io,
                      model_metadata_io,
                      model_response_result["signed"],
                      metadata,
                      model_wrong_result.model_wrong,
                      null,
                      endpoint
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
                        });

                        if (!!store_example_result.badges) {
                          this.setState({
                            showBadges: store_example_result.badges,
                          });
                        }
                        if (!this.state.retainInput) {
                          const example_io = JSON.parse(
                            JSON.stringify(this.state.example_io)
                          );
                          this.state.input_io_def
                            .concat(this.state.output_io_def)
                            .forEach((io_obj) => {
                              example_io[io_obj.name] = null;
                            });
                          this.setState({ example_io: example_io });
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
                },
                (error) => {
                  console.log(error);
                  this.setState({
                    submitDisabled: false,
                    refreshDisabled: false,
                    fetchPredictionError: true,
                  });
                }
              )
              .then(() => this.smoothlyAnimateToBottom());
          }
        },
        (error) => {
          console.log(error);
          if (error && error.message && error.message === "Unauthorized") {
            this.props.history.push(
              "/login?msg=" +
                encodeURIComponent("You need to login to use this feature.") +
                "&src=" +
                encodeURIComponent(`/tasks/${this.state.taskCode}/create`)
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
          encodeURIComponent(`/tasks/${this.state.taskCode}/create`)
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

    this.setState({ taskCode: params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          this.setState(
            { task: result, taskCode: result.task_code },
            function () {
              this.state.task.selected_round = this.state.task.cur_round;
              this.getNewContext();
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

  render() {
    const responseContent = this.state.content
      .map((item, index) =>
        item.cls === "context" ? undefined : (
          <ResponseInfo
            input_io_def={this.state.input_io_def}
            output_io_def={this.state.output_io_def}
            context_io_def={this.state.context_io_def}
            model_metadata_io_def={this.state.model_metadata_io_def}
            user_metadata_model_wrong_io_def={
              this.state.user_metadata_model_wrong_io_def
            }
            user_metadata_model_correct_io_def={
              this.state.user_metadata_model_correct_io_def
            }
            key={index}
            index={index}
            exampleId={this.state.mapKeyToExampleId[index + 1]}
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

    // The goal_message_multiple_choice type is special. We want this object to
    // appear in a special place in the interface.
    const goalMessageIO = this.state.input_io_def
      .concat(this.state.output_io_def)
      .filter((io_obj, _) => io_obj.type === "goal_message_multiple_choice")
      .map((io_obj, _) => (
        <div
          className={
            this.state.example_io[io_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            key={io_obj.name}
            create={true}
            name={io_obj.name}
            example_io={this.state.example_io}
            set_example_io={(example_io) =>
              this.setState({ example_io: example_io })
            }
            type={io_obj.type}
            constructor_args={io_obj.constructor_args}
          />
        </div>
      ));

    // The context_string_selection type is special. When it is present, we want
    // to remove the context string from view and put the context_string_selection
    // in its place
    const contextStringSelectionGroup = this.state.input_io_def
      .concat(this.state.output_io_def)
      .filter((io_obj, _) => io_obj.type === "context_string_selection");
    const selectableContexts = contextStringSelectionGroup.map(
      (io_obj) => io_obj.constructor_args.reference_key
    );
    const contextIO = this.state.context_io_def
      .concat(contextStringSelectionGroup)
      .filter((io_obj, _) => !selectableContexts.includes(io_obj.name))
      .map((io_obj, _) => (
        <div
          className={
            this.state.example_io[io_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            key={io_obj.name}
            create={io_obj.type === "context_string_selection" ? true : false}
            name={io_obj.name}
            example_io={this.state.example_io}
            set_example_io={() => {}}
            type={io_obj.type}
            constructor_args={io_obj.constructor_args}
          />
        </div>
      ));

    const belowModelResponseIO = this.state.input_io_def
      .concat(this.state.output_io_def)
      .filter(
        (io_obj, _) =>
          ![
            "goal_message_multiple_choice",
            "context_string_selection",
          ].includes(io_obj.type)
      )
      .map((io_obj, _) => (
        <div
          className={
            this.state.example_io[io_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            key={io_obj.name}
            create={true}
            name={io_obj.name}
            example_io={this.state.example_io}
            set_example_io={(example_io) =>
              this.setState({ example_io: example_io })
            }
            type={io_obj.type}
            constructor_args={io_obj.constructor_args}
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
                <Modal.Body>
                  <Markdown>{this.state.task.instructions}</Markdown>
                </Modal.Body>
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
            <div className={"mb-3"}>
              {this.state.task.goal_message ||
              (goalMessageIO && goalMessageIO.length) > 0 ? (
                <div className="mb-1 p-3 rounded light-gray-bg">
                  {this.state.task.goal_message ? (
                    <InputGroup className="align-items-center">
                      <i className="fas fa-flag-checkered mr-1"></i>
                      Your goal: {this.state.task.goal_message}
                    </InputGroup>
                  ) : null}
                  {goalMessageIO}
                </div>
              ) : null}
            </div>
            <Card className="profile-card overflow-hidden">
              {contextIO && contextIO.length > 0 ? (
                <div className="mb-1 p-3 rounded light-gray-bg">
                  {contextIO}
                </div>
              ) : (
                ""
              )}
              <Card.Body
                className="overflow-auto pt-2"
                style={{
                  height: 385,
                }}
                ref={this.chatContainerRef}
              >
                {responseContent}
                <div className="bottom-anchor" ref={this.bottomAnchorRef} />
              </Card.Body>
              <div className="mb-1 p-3">{belowModelResponseIO}</div>
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
                          tooltip="Don’t like this context? Try another one."
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
        </Container>
      </OverlayProvider>
    );
  }
}

export default CreateInterface;
