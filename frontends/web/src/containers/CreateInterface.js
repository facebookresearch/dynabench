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
      metadataIO: {},
      modelWrong: this.props.obj.modelWrong,
    };
  }
  componentDidMount() {
    const metadataIO = {};
    this.props.ioDef.metadata.create
      .filter(
        (ioDefObj) =>
          ioDefObj.model_wrong_condition === undefined ||
          ioDefObj.model_wrong_condition === this.state.modelWrong
      )
      .forEach((ioDefObj) => {
        initializeIO(metadataIO, ioDefObj);
      });
    this.setState({
      metadataIO: metadataIO,
      exampleUpdated: null,
      feedbackSaved: null,
    });
  }

  updateUserMetadataIO() {
    const nonNullMetadataIO = {};
    this.props.ioDef.metadata.create
      .filter(
        (ioDefObj) =>
          ioDefObj.model_wrong_condition === undefined ||
          ioDefObj.model_wrong_condition === this.state.modelWrong
      )
      .forEach((ioObj) => {
        if (this.state.metadataIO[ioObj.name] !== null) {
          nonNullMetadataIO[ioObj.name] = this.state.metadataIO[ioObj.name];
        }
      });
    this.context.api.updateExample(this.props.exampleId, {
      metadata: nonNullMetadataIO,
    });
  }

  updateModelWrong(modelWrong) {
    if (this.props.obj.livemode) {
      this.context.api
        .updateExample(this.props.exampleId, {
          model_wrong: modelWrong,
        })
        .then(
          (result) => this.setState({ modelWrong: modelWrong }),
          (error) => {
            console.log(error);
          }
        );
    } else {
      this.setState({ modelWrong: modelWrong });
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

    const input = this.props.ioDef.input.map((ioDefObj) => (
      <IO
        displayName={ioDefObj.display_name}
        className="name-display-secondary"
        key={ioDefObj.name}
        create={false}
        name={ioDefObj.name}
        exampleIO={this.props.obj.inputIO}
        setExampleIO={() => {}}
        type={ioDefObj.type}
        constructorArgs={ioDefObj.constructor_args}
      />
    ));

    const target = this.props.ioDef.target.map((ioDefObj) => (
      <IO
        displayName={ioDefObj.display_name}
        className="name-display-secondary"
        key={ioDefObj.name}
        create={false}
        name={ioDefObj.name}
        exampleIO={this.props.obj.targetIO}
        setExampleIO={() => {}}
        type={ioDefObj.type}
        constructorArgs={ioDefObj.constructor_args}
      />
    ));

    const outputToCompareToTarget =
      this.props.obj.url === null
        ? null
        : this.props.ioDef.target.map((ioDefObj) => (
            <IO
              displayName={ioDefObj.display_name}
              className="name-display-secondary"
              key={ioDefObj.name}
              create={false}
              name={ioDefObj.name}
              exampleIO={this.props.obj.outputIO}
              setExampleIO={() => {}}
              type={ioDefObj.type}
              constructorArgs={ioDefObj.constructor_args}
            />
          ));

    const otherModelOutput =
      this.props.obj.url === null
        ? null
        : this.props.ioDef.output
            .filter(
              (ioDefObj) =>
                !this.props.ioDef.target
                  .map((ioDefObjT) => ioDefObjT.name)
                  .includes(ioDefObj.name)
            )
            .map((ioDefObj) => (
              <IO
                displayName={ioDefObj.display_name}
                className="name-display-secondary"
                key={ioDefObj.name}
                create={false}
                name={ioDefObj.name}
                exampleIO={this.props.obj.outputIO}
                setExampleIO={() => {}}
                type={ioDefObj.type}
                constructorArgs={ioDefObj.constructor_args}
              />
            ));

    const metadata = this.props.ioDef.metadata.create
      .filter(
        (ioDefObj) =>
          ioDefObj.model_wrong_condition === undefined ||
          ioDefObj.model_wrong_condition === this.state.modelWrong
      )
      .map((ioDefObj) => (
        <IO
          displayName={ioDefObj.display_name}
          className="user-input-secondary"
          key={ioDefObj.name}
          create={true}
          name={ioDefObj.name}
          exampleIO={this.state.metadataIO}
          setExampleIO={(exampleIO) =>
            this.setState({ metadataIO: exampleIO, exampleUpdated: false })
          }
          type={ioDefObj.type}
          constructorArgs={ioDefObj.constructor_args}
        />
      ));

    var classNames = this.props.obj.cls + " rounded border m-3";

    var userFeedback = (
      <>
        {this.props.obj.livemode ? (
          (this.state.modelWrong !== null || this.props.obj.url === null) &&
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
        if (this.state.modelWrong === null) {
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
          if (this.state.modelWrong) {
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
      ioDef: {
        input: [],
        target: [],
        output: [],
        context: [],
        metadata: { create: [] },
      },
      inputIO: {},
      targetIO: {},
      contextIO: {},
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
            const ioDef = JSON.parse(this.state.task.io_def);
            const inputIO = {};
            for (const ioDefObj of ioDef.input) {
              initializeIO(inputIO, ioDefObj);
            }
            const targetIO = {};
            for (const ioDefObj of ioDef.target) {
              initializeIO(targetIO, ioDefObj);
            }
            this.setState({
              ioDef: ioDef,
              inputIO: inputIO,
              targetIO: targetIO,
              contextIO: JSON.parse(result.context_json),
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
      var settings;
      if (this.context.user.settings_json) {
        settings = JSON.parse(this.context.user.settings_json);
        settings["retain_input"] = retainInput;
      } else {
        settings = { retain_input: retainInput };
      }
      this.context.user.settings_json = JSON.stringify(settings);
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
    const inputIO = JSON.parse(JSON.stringify(this.state.inputIO));
    const targetIO = JSON.parse(JSON.stringify(this.state.targetIO));
    this.state.ioDef.input.forEach((ioDefObj) => {
      initializeIO(inputIO, ioDefObj);
    });
    this.state.ioDef.target.forEach((ioDefObj) => {
      initializeIO(targetIO, ioDefObj);
    });
    this.setState({ targetIO: targetIO, inputIO: inputIO });
  }

  handleStoreExampleAndResponseInfo(
    signature,
    modelWrong,
    outputIO,
    endpoint,
    metadata
  ) {
    this.setState(
      {
        content: [
          ...this.state.content,
          {
            livemode: this.state.livemode,
            modelWrong: modelWrong,
            inputIO: JSON.parse(JSON.stringify(this.state.inputIO)),
            targetIO: JSON.parse(JSON.stringify(this.state.targetIO)),
            outputIO: outputIO,
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
        this.state.inputIO,
        this.state.targetIO,
        outputIO,
        signature,
        metadata,
        modelWrong,
        null,
        endpoint
      )
      .then(
        (storeExampleResult) => {
          var key = this.state.content.length;
          // Reset state variables and store example id.
          this.setState({
            submitDisabled: false,
            refreshDisabled: false,
            mapKeyToExampleId: {
              ...this.state.mapKeyToExampleId,
              [key]: storeExampleResult.id,
            },
          });

          if (!!storeExampleResult.badges) {
            this.setState({
              showBadges: storeExampleResult.badges,
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
    var incompleteExample = false;
    this.state.ioDef.input.forEach((ioDefObj) => {
      if (this.state.inputIO[ioDefObj.name] === null) {
        this.setState({ submitWithoutFullExample: true });
        incompleteExample = true;
      }
    });
    this.state.ioDef.target.forEach((ioDefObj) => {
      if (this.state.targetIO[ioDefObj.name] === null) {
        this.setState({ submitWithoutFullExample: true });
        incompleteExample = true;
      }
    });
    if (incompleteExample) {
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
        this.state.inputIO["hypothesis"] = this.state.inputIO["statement"];
      }
      if (!endpoint.startsWith("ts") && this.state.task.task_code === "qa") {
        this.state.inputIO["hypothesis"] = this.state.inputIO["question"];
      }
      // End hack that can be removed upon full dynalab integration

      this.context.api
        .getModelResponse(
          url,
          Object.assign({}, this.state.inputIO, this.state.contextIO)
        )
        .then(
          (modelResponseResult) => {
            // Begin hack that can be removed upon full dynalab integration
            if (
              !endpoint.startsWith("ts") &&
              this.state.task.task_code === "hs"
            ) {
              modelResponseResult["label"] =
                modelResponseResult["prob"][0] > modelResponseResult["prob"][1]
                  ? "not-hateful"
                  : "hateful";
              modelResponseResult["prob"] = {
                "not-hateful": modelResponseResult["prob"][0],
                hateful: modelResponseResult["prob"][1],
              };
            }
            if (
              !endpoint.startsWith("ts") &&
              this.state.task.task_code === "sentiment"
            ) {
              modelResponseResult["label"] =
                modelResponseResult["prob"][0] >
                  modelResponseResult["prob"][1] &&
                modelResponseResult["prob"][0] > modelResponseResult["prob"][2]
                  ? "negative"
                  : modelResponseResult["prob"][1] >
                    modelResponseResult["prob"][2]
                  ? "positive"
                  : "neutral";
              modelResponseResult["prob"] = {
                negative: modelResponseResult["prob"][0],
                positive: modelResponseResult["prob"][1],
                neutral: modelResponseResult["prob"][2],
              };
            }
            if (
              !endpoint.startsWith("ts") &&
              this.state.task.task_code === "nli"
            ) {
              modelResponseResult["label"] =
                modelResponseResult["prob"][0] >
                  modelResponseResult["prob"][1] &&
                modelResponseResult["prob"][0] > modelResponseResult["prob"][2]
                  ? "entailed"
                  : modelResponseResult["prob"][1] >
                    modelResponseResult["prob"][2]
                  ? "neutral"
                  : "contradictory";
              modelResponseResult["prob"] = {
                entailed: modelResponseResult["prob"][0],
                neutral: modelResponseResult["prob"][1],
                contradictory: modelResponseResult["prob"][2],
              };
            }
            if (
              !endpoint.startsWith("ts") &&
              this.state.task.task_code === "qa"
            ) {
              modelResponseResult["answer"] = modelResponseResult["text"];
              modelResponseResult["conf"] = modelResponseResult["prob"];
            }
            // End hack that can be removed upon full dynalab integration

            if (modelResponseResult.errorMessage) {
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

              const outputIO = JSON.parse(JSON.stringify(modelResponseResult));

              const metadata = { model: this.state.randomTargetModel };
              this.context.api
                .getModelWrong(
                  this.state.task.id,
                  this.state.targetIO,
                  outputIO
                )
                .then(
                  (modelWrongResult) =>
                    this.handleStoreExampleAndResponseInfo(
                      modelResponseResult["signed"],
                      modelWrongResult.model_wrong,
                      outputIO,
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
            var settings = JSON.parse(result.settings_json);
            if (settings["retain_input"]) {
              this.setState({ retainInput: settings["retain_input"] });
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

  disentangleAndSetInputAndTargetIO(exampleIO) {
    const inputIO = this.state.inputIO;
    for (const ioDefObj of this.state.ioDef.input) {
      if (exampleIO.hasOwnProperty(ioDefObj.name)) {
        inputIO[ioDefObj.name] = exampleIO[ioDefObj.name];
      }
    }

    const targetIO = this.state.targetIO;
    for (const ioDefObj of this.state.ioDef.target) {
      if (exampleIO.hasOwnProperty(ioDefObj.name)) {
        targetIO[ioDefObj.name] = exampleIO[ioDefObj.name];
      }
    }

    this.setState({ inputIO: inputIO, targetIO: targetIO });
  }

  render() {
    const responseContent = this.state.content
      .map((item, index) => (
        <ResponseInfo
          ioDef={this.state.ioDef}
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

    // The target_label type is special. We want this object to
    // appear in a special place in the interface.
    const goalMessageIO = this.state.ioDef.input
      .concat(this.state.ioDef.target)
      .filter((ioDefObj) => ioDefObj.type === "target_label")
      .map((ioDefObj) => (
        <div
          key={ioDefObj.name}
          className={
            this.state.inputIO[ioDefObj.name] === null &&
            this.state.targetIO[ioDefObj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            displayName={ioDefObj.display_name}
            className="user-input-primary"
            key={ioDefObj.name}
            create={true}
            name={ioDefObj.name}
            exampleIO={Object.assign(
              {},
              this.state.inputIO,
              this.state.targetIO,
              this.state.contextIO
            )}
            setExampleIO={(exampleIO) =>
              this.disentangleAndSetInputAndTargetIO(exampleIO)
            }
            type={ioDefObj.type}
            constructorArgs={ioDefObj.constructor_args}
          />
        </div>
      ));

    // The context_string_selection type is special. When it is present, we want
    // to remove the context string from view and put the context_string_selection
    // in its place
    const contextStringSelectionGroup = this.state.ioDef.input
      .concat(this.state.ioDef.target)
      .filter((ioDefObj) => ioDefObj.type === "context_string_selection");
    const selectableContexts = contextStringSelectionGroup.map(
      (ioDefObj) => ioDefObj.constructor_args.reference_name
    );
    const tooTallForResponseInfoPlaceholder = this.state.ioDef.context
      .map((ioDefObj) => ioDefObj.type)
      .includes("image_url");
    const contextIO = this.state.ioDef.context
      .concat(contextStringSelectionGroup)
      .filter((ioDefObj) => !selectableContexts.includes(ioDefObj.name))
      .map((ioDefObj) => (
        <div
          key={ioDefObj.name}
          className={
            this.state.inputIO[ioDefObj.name] === null &&
            this.state.targetIO[ioDefObj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            displayName={ioDefObj.display_name}
            className={
              ioDefObj.type === "context_string_selection"
                ? "user-input-primary"
                : "name-display-primary"
            }
            key={ioDefObj.name}
            create={ioDefObj.type === "context_string_selection" ? true : false}
            name={ioDefObj.name}
            exampleIO={Object.assign(
              {},
              this.state.inputIO,
              this.state.targetIO,
              this.state.contextIO
            )}
            setExampleIO={(exampleIO) =>
              this.disentangleAndSetInputAndTargetIO(exampleIO)
            }
            type={ioDefObj.type}
            constructorArgs={ioDefObj.constructor_args}
          />
        </div>
      ));

    const belowModelResponseIO = this.state.ioDef.input
      .concat(this.state.ioDef.target)
      .filter(
        (ioDefObj) =>
          !["target_label", "context_string_selection"].includes(ioDefObj.type)
      )
      .map((ioDefObj) => (
        <div
          key={ioDefObj.name}
          className={
            this.state.inputIO[ioDefObj.name] === null &&
            this.state.targetIO[ioDefObj.name] === null &&
            this.state.submitWithoutFullExample
              ? "border rounded border-danger"
              : ""
          }
        >
          <IO
            displayName={ioDefObj.display_name}
            className="user-input-primary"
            key={ioDefObj.name}
            create={true}
            name={ioDefObj.name}
            exampleIO={Object.assign(
              {},
              this.state.inputIO,
              this.state.targetIO,
              this.state.contextIO
            )}
            setExampleIO={(exampleIO) =>
              this.disentangleAndSetInputAndTargetIO(exampleIO)
            }
            type={ioDefObj.type}
            constructorArgs={ioDefObj.constructor_args}
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
                  <Markdown>{this.state.task.instructions_md}</Markdown>
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
              {this.state.io_def.goal_message ||
              (goalMessageIO && goalMessageIO.length) > 0 ? (
                <div className="mb-1 p-3 rounded light-gray-bg">
                  {this.state.io_def.goal_message ? (
                    <InputGroup className="align-items-center">
                      <i className="fas fa-flag-checkered mr-1"></i>
                      Your goal: {this.state.io_def.goal_message}
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
