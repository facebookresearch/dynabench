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
        {props.randomTargetModel
          ? "Find examples that fool the model"
          : "Find examples"}
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
      metadata_io: {},
      model_wrong: this.props.obj.model_wrong,
    };
  }
  componentDidMount() {
    const metadata_io = {};
    this.props.io_def.metadata
      .filter(
        (io_def_obj) =>
          io_def_obj.model_wrong === undefined ||
          io_def_obj.model_wrong === this.state.model_wrong
      )
      .forEach((io_def_obj) => {
        metadata_io[io_def_obj.name] = null;
      });
    this.setState({
      metadata_io: metadata_io,
      exampleUpdated: null,
      feedbackSaved: null,
    });
  }

  updateUserMetadataIO() {
    const non_null_metadata_io = {};
    this.props.io_def.metadata
      .filter(
        (io_def_obj) =>
          io_def_obj.model_wrong === undefined ||
          io_def_obj.model_wrong === this.state.model_wrong
      )
      .forEach((io_obj) => {
        if (this.state.metadata_io[io_obj.name] !== null) {
          non_null_metadata_io[io_obj.name] = this.state.metadata_io[
            io_obj.name
          ];
        }
      });
    this.context.api.updateExample(this.props.exampleId, {
      metadata_io: non_null_metadata_io,
    });
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

    const input = this.props.io_def.input.map((io_def_obj) => (
      <IO
        display_name={io_def_obj.display_name}
        className="name-display-secondary"
        key={io_def_obj.name}
        create={false}
        name={io_def_obj.name}
        example_io={this.props.obj.input_io}
        set_example_io={() => {}}
        type={io_def_obj.type}
        constructor_args={io_def_obj.constructor_args}
      />
    ));

    const target = this.props.io_def.target.map((io_def_obj) => (
      <IO
        display_name={io_def_obj.display_name}
        className="name-display-secondary"
        key={io_def_obj.name}
        create={false}
        name={io_def_obj.name}
        example_io={this.props.obj.target_io}
        set_example_io={() => {}}
        type={io_def_obj.type}
        constructor_args={io_def_obj.constructor_args}
      />
    ));

    const outputToCompareToTarget =
      this.props.obj.url === null
        ? null
        : this.props.io_def.target.map((io_def_obj) => (
            <IO
              display_name={io_def_obj.display_name}
              className="name-display-secondary"
              key={io_def_obj.name}
              create={false}
              name={io_def_obj.name}
              example_io={this.props.obj.output_io}
              set_example_io={() => {}}
              type={io_def_obj.type}
              constructor_args={io_def_obj.constructor_args}
            />
          ));

    const otherModelOutput =
      this.props.obj.url === null
        ? null
        : this.props.io_def.output
            .filter(
              (io_def_obj) =>
                !this.props.io_def.target
                  .map((io_def_obj_t) => io_def_obj_t.name)
                  .includes(io_def_obj.name)
            )
            .map((io_def_obj) => (
              <IO
                display_name={io_def_obj.display_name}
                className="name-display-secondary"
                key={io_def_obj.name}
                create={false}
                name={io_def_obj.name}
                example_io={this.props.obj.output_io}
                set_example_io={() => {}}
                type={io_def_obj.type}
                constructor_args={io_def_obj.constructor_args}
              />
            ));

    const metadata = this.props.io_def.metadata
      .filter(
        (io_def_obj) =>
          io_def_obj.model_wrong === undefined ||
          io_def_obj.model_wrong === this.state.model_wrong
      )
      .map((io_def_obj) => (
        <IO
          display_name={io_def_obj.display_name}
          className="user-input-secondary"
          key={io_def_obj.name}
          create={true}
          name={io_def_obj.name}
          example_io={this.state.metadata_io}
          set_example_io={(example_io) =>
            this.setState({ metadata_io: example_io, exampleUpdated: false })
          }
          type={io_def_obj.type}
          constructor_args={io_def_obj.constructor_args}
        />
      ));

    var classNames = this.props.obj.cls + " rounded border m-3";

    var userFeedback = (
      <>
        {this.props.obj.livemode ? (
          (this.state.model_wrong !== null || this.props.obj.url === null) &&
          metadata.length > 0 ? (
            <div className="mt-3">
              <span>You can enter more info for your example:</span>
              <button
                onClick={() => {
                  this.updateUserMetadataIO();
                  this.setState({ exampleUpdated: true });
                }}
                type="button"
                style={{ float: "right", margin: "5px" }}
                className="btn btn-outline-primary btn-sm "
                disabled={this.state.exampleUpdated}
              >
                {this.state.exampleUpdated ? "Saved!" : "Save Info"}
              </button>
              {metadata}
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
    var modelCorrectQuestion = null;
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
      if (this.props.obj.url === null) {
        title = (
          <span>
            <strong>Thank you for your example</strong>
          </span>
        );
      } else {
        if (this.state.model_wrong === null) {
          classNames += " light-gray-bg";
          modelCorrectQuestion = (
            <span>
              <strong>Is the model correct?</strong>
              <br />
              <div className="btn-group" role="group" aria-label="model wrong">
                <button
                  data-index={this.props.index}
                  onClick={() => this.updateModelWrong(false)}
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                >
                  Correct
                </button>
                <button
                  data-index={this.props.index}
                  onClick={() => this.updateModelWrong(true)}
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                >
                  Incorrect
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
    }

    const submissionResults = (
      <Row>
        <Col>
          <nobr>The model predicted</nobr>
        </Col>
        <Col className="text-center">
          <strong>{outputToCompareToTarget}</strong>
        </Col>
        <Col>
          <nobr>and you say</nobr>
        </Col>
        <Col className="text-center">
          <strong>{target}</strong>
        </Col>
      </Row>
    );

    const submissionResultsNoModel = (
      <Row>
        <Col>
          <nobr>You say</nobr>
        </Col>
        <Col className="text-center">
          <strong>{target}</strong>
        </Col>
        <Col>
          <nobr>given the input</nobr>
        </Col>
        <Col className="text-center">
          <strong>{input}</strong>
        </Col>
      </Row>
    );

    const submissionResultsNoTarget = (
      <Row>
        <Col>
          <nobr>The model predicted</nobr>
        </Col>
        <Col className="text-center">
          <strong>{otherModelOutput}</strong>
        </Col>
        <Col>
          <nobr>given the input</nobr>
        </Col>
        <Col className="text-center">
          <strong>{input}</strong>
        </Col>
      </Row>
    );

    return (
      <Card className={classNames} style={{ minHeight: 120 }}>
        <Card.Body className="p-3">
          {this.props.obj.url === null ? (
            <Row>
              <Col xs={12} md={9}>
                {title !== null ? <div className="mb-3">{title}</div> : null}
                {submissionResultsNoModel}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}></Col>
            </Row>
          ) : target.length > 0 ? (
            <Row>
              <Col xs={12} md={9}>
                {title !== null ? <div className="mb-3">{title}</div> : null}
                {modelCorrectQuestion !== null ? (
                  <div className="mb-3">{modelCorrectQuestion}</div>
                ) : null}
                <div className="mb-3">
                  <strong>{input}</strong>
                </div>
                {submissionResults}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}>
                {otherModelOutput}
              </Col>
            </Row>
          ) : (
            <Row>
              <Col xs={12} md={9}>
                {title !== null ? <div className="mb-3">{title}</div> : null}
                {submissionResultsNoTarget}
                {modelCorrectQuestion !== null ? (
                  <div className="mb-3">{modelCorrectQuestion}</div>
                ) : null}
                {userFeedback}
                {sandboxContent}
              </Col>
              <Col className="text-center" xs={12} md={3}></Col>
            </Row>
          )}
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
      io_def: { input: [], target: [], output: [], context: [], metadata: [] },
      input_io: {},
      target_io: {},
      context_io: {},
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.switchLiveMode = this.switchLiveMode.bind(this);
    this.updateRetainInput = this.updateRetainInput.bind(this);
    this.updateSelectedRound = this.updateSelectedRound.bind(this);
    this.clearUserInput = this.clearUserInput.bind(this);
    this.handleStoreExampleAndResponseInfo = this.handleStoreExampleAndResponseInfo.bind(
      this
    );
    this.disentangleAndSetInputAndTargetIO = this.disentangleAndSetInputAndTargetIO.bind(
      this
    );
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
            const randomTargetModel =
              this.state.task.round.url !== null
                ? this.pickModel(this.state.task.round.url)
                : null;
            const io_def = JSON.parse(this.state.task.io_def);
            const input_io = {};
            for (const io_def_obj of io_def.input) {
              input_io[io_def_obj.name] = null;
            }
            const target_io = {};
            for (const io_def_obj of io_def.target) {
              target_io[io_def_obj.name] = null;
            }
            this.setState({
              io_def: io_def,
              input_io: input_io,
              target_io: target_io,
              context_io: JSON.parse(result.context_io),
              randomTargetModel: randomTargetModel,
              context: result,
              content: [],
              submitDisabled: false,
              refreshDisabled: false,
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

  clearUserInput() {
    const input_io = JSON.parse(JSON.stringify(this.state.input_io));
    const target_io = JSON.parse(JSON.stringify(this.state.target_io));
    this.state.io_def.input.forEach((io_def_obj) => {
      input_io[io_def_obj.name] = null;
    });
    this.state.io_def.target.forEach((io_def_obj) => {
      target_io[io_def_obj.name] = null;
    });
    this.setState({ target_io: target_io, input_io: input_io });
  }

  handleStoreExampleAndResponseInfo(
    signature,
    model_wrong,
    output_io,
    endpoint,
    metadata
  ) {
    this.setState(
      {
        content: [
          ...this.state.content,
          {
            livemode: this.state.livemode,
            model_wrong: model_wrong,
            input_io: JSON.parse(JSON.stringify(this.state.input_io)),
            target_io: JSON.parse(JSON.stringify(this.state.target_io)),
            output_io: output_io,
            url: this.state.randomTargetModel,
            retracted: false,
          },
        ],
      },
      () => {
        if (!this.state.livemode) {
          if (!this.state.retainInput) {
            this.clearUserInput();
          }
        }
        this.setState({
          submitDisabled: false,
          refreshDisabled: false,
        });
        return;
      }
    );

    // Save examples.
    return this.context.api
      .storeExample(
        this.state.task.id,
        this.state.task.selected_round,
        this.context.user.id,
        this.state.context.id,
        this.state.input_io,
        this.state.target_io,
        output_io,
        signature,
        metadata,
        model_wrong,
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
            this.clearUserInput();
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

  handleResponse(e) {
    e.preventDefault();
    var incomplete_example = false;
    this.state.io_def.input.forEach((io_def_obj) => {
      if (this.state.input_io[io_def_obj.name] === null) {
        this.setState({ submitWithoutFullExample: true });
        incomplete_example = true;
      }
    });
    this.state.io_def.target.forEach((io_def_obj) => {
      if (this.state.target_io[io_def_obj.name] === null) {
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

      if (url === null) {
        // In this case, there is no target model. Just store the example without model data.
        this.handleStoreExampleAndResponseInfo(
          null,
          null,
          null,
          null,
          null
        ).then(() => this.smoothlyAnimateToBottom());
        return;
      }
      const endpoint = url.split("predict?model=")[1];

      // Begin hack that can be removed upon full dynalab integration
      if (
        !endpoint.startsWith("ts") &&
        (this.state.task.task_code === "hs" ||
          this.state.task.task_code === "sentiment")
      ) {
        this.state.input_io["hypothesis"] = this.state.input_io["statement"];
      }
      if (!endpoint.startsWith("ts") && this.state.task.task_code === "qa") {
        this.state.input_io["hypothesis"] = this.state.input_io["question"];
      }
      // End hack that can be removed upon full dynalab integration

      this.context.api
        .getModelResponse(
          url,
          Object.assign({}, this.state.input_io, this.state.context_io)
        )
        .then(
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

              const output_io = JSON.parse(
                JSON.stringify(model_response_result)
              );

              const metadata = { model: this.state.randomTargetModel };
              this.context.api
                .getModelWrong(
                  this.state.task.id,
                  this.state.target_io,
                  output_io
                )
                .then(
                  (model_wrong_result) =>
                    this.handleStoreExampleAndResponseInfo(
                      model_response_result["signed"],
                      model_wrong_result.model_wrong,
                      output_io,
                      endpoint,
                      metadata
                    ),
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

  disentangleAndSetInputAndTargetIO(example_io) {
    const input_io = this.state.input_io;
    for (const io_def_obj of this.state.io_def.input) {
      if (example_io.hasOwnProperty(io_def_obj.name)) {
        input_io[io_def_obj.name] = example_io[io_def_obj.name];
      }
    }

    const target_io = this.state.target_io;
    for (const io_def_obj of this.state.io_def.target) {
      if (example_io.hasOwnProperty(io_def_obj.name)) {
        target_io[io_def_obj.name] = example_io[io_def_obj.name];
      }
    }

    this.setState({ input_io: input_io, target_io: target_io });
  }

  render() {
    const responseContent = this.state.content
      .map((item, index) => (
        <ResponseInfo
          io_def={this.state.io_def}
          key={index}
          index={index}
          exampleId={this.state.mapKeyToExampleId[index + 1]}
          obj={item}
          content={this.state.content}
        />
      ))
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
    const goalMessageIO = this.state.io_def.input
      .concat(this.state.io_def.target)
      .filter(
        (io_def_obj) => io_def_obj.type === "goal_message_multiple_choice"
      )
      .map((io_def_obj) => (
        <div
          key={io_def_obj.name}
          className={
            this.state.input_io[io_def_obj.name] === null &&
            this.state.target_io[io_def_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            display_name={io_def_obj.display_name}
            className="user-input-primary"
            key={io_def_obj.name}
            create={true}
            name={io_def_obj.name}
            example_io={Object.assign(
              {},
              this.state.input_io,
              this.state.target_io,
              this.state.context_io
            )}
            set_example_io={(example_io) =>
              this.disentangleAndSetInputAndTargetIO(example_io)
            }
            type={io_def_obj.type}
            constructor_args={io_def_obj.constructor_args}
          />
        </div>
      ));

    // The context_string_selection type is special. When it is present, we want
    // to remove the context string from view and put the context_string_selection
    // in its place
    const contextStringSelectionGroup = this.state.io_def.input
      .concat(this.state.io_def.target)
      .filter((io_def_obj) => io_def_obj.type === "context_string_selection");
    const selectableContexts = contextStringSelectionGroup.map(
      (io_def_obj) => io_def_obj.constructor_args.reference_key
    );
    const tooTallForResponseInfoPlaceholder = this.state.io_def.context
      .map((io_def_obj) => io_def_obj.type)
      .includes("image_url");
    const contextIO = this.state.io_def.context
      .concat(contextStringSelectionGroup)
      .filter((io_def_obj) => !selectableContexts.includes(io_def_obj.name))
      .map((io_def_obj) => (
        <div
          key={io_def_obj.name}
          className={
            this.state.input_io[io_def_obj.name] === null &&
            this.state.target_io[io_def_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            display_name={io_def_obj.display_name}
            className={
              io_def_obj.type === "context_string_selection"
                ? "user-input-primary"
                : "name-display-primary"
            }
            key={io_def_obj.name}
            create={
              io_def_obj.type === "context_string_selection" ? true : false
            }
            name={io_def_obj.name}
            example_io={Object.assign(
              {},
              this.state.input_io,
              this.state.target_io,
              this.state.context_io
            )}
            set_example_io={(example_io) =>
              this.disentangleAndSetInputAndTargetIO(example_io)
            }
            type={io_def_obj.type}
            constructor_args={io_def_obj.constructor_args}
          />
        </div>
      ));

    const belowModelResponseIO = this.state.io_def.input
      .concat(this.state.io_def.target)
      .filter(
        (io_def_obj) =>
          ![
            "goal_message_multiple_choice",
            "context_string_selection",
          ].includes(io_def_obj.type)
      )
      .map((io_def_obj) => (
        <div
          key={io_def_obj.name}
          className={
            this.state.input_io[io_def_obj.name] === null &&
            this.state.target_io[io_def_obj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            display_name={io_def_obj.display_name}
            className="user-input-primary"
            key={io_def_obj.name}
            create={true}
            name={io_def_obj.name}
            example_io={Object.assign(
              {},
              this.state.input_io,
              this.state.target_io,
              this.state.context_io
            )}
            set_example_io={(example_io) =>
              this.disentangleAndSetInputAndTargetIO(example_io)
            }
            type={io_def_obj.type}
            constructor_args={io_def_obj.constructor_args}
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
              randomTargetModel={this.state.randomTargetModel}
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
                  height: tooTallForResponseInfoPlaceholder ? "auto" : 385,
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
