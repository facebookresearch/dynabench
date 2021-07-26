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
  CardGroup,
  Button,
  Nav,
  Table,
  FormControl,
  Spinner,
  ProgressBar,
  InputGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { FaInfoCircle, FaThumbsUp, FaThumbsDown } from "react-icons/fa";

// import UserContext from './UserContext';
import { TokenAnnotator } from "react-text-annotate";
import IdleTimer from "react-idle-timer";

import "./CreateInterface.css";

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.taskType == "extract" ? (
      <>
        <TokenAnnotator
          id="tokenAnnotator"
          className="mb-1 p-3 light-gray-bg qa-context"
          tokens={this.props.text.split(/\b|(?<=[\s\(\)])|(?=[\s\(\)])/)}
          value={this.props.answer}
          onChange={this.props.updateAnswer}
          getSpan={(span) => ({
            ...span,
            tag: "ANS",
          })}
        />
        <p>
          <small>
            <strong>Your goal:</strong> enter a question below and select an
            answer from the passage above.
          </small>
        </p>
      </>
    ) : (
      <>
        <div className="context">{this.props.text}</div>
        <p>
          <small>
            <strong>Your goal:</strong> enter a{" "}
            <strong>{this.props.targets[this.props.curTarget]}</strong>{" "}
            statement that fools the model.
          </small>
        </p>
      </>
    );
  }
}

class CreateInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.model_name = props.model_name;
    this.model_url = props.model_url;
    this.generator_name = props.generator_name;
    this.generator_url = props.generator_url;
    this.experiment_mode = props.experiment_mode;
    this.state = {
      answer: [],
      taskId: props.taskConfig.task_id,
      task: {},
      context: null,
      target: 0,
      modelPredIdx: null,
      modelPredStr: "",
      hypothesis: "",
      content: [],
      generatedAnswer: null,
      submitDisabled: true,
      generateDisabled: true,
      refreshDisabled: true,
      progressSubmitting: false,
      progressGenerating: false,
      numQuestionsGenerated: 0,
      mapKeyToExampleId: {},
      exampleHistory: [],
      tries: 0,
      total_tries: 5, // NOTE: Set this to your preferred value
      taskCompleted: false,
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
    this.handleModelResponse = this.handleModelResponse.bind(this);
    this.handleGeneratorResponse = this.handleGeneratorResponse.bind(this);
    this.handleVerifyResponse = this.handleVerifyResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.storeExample = this.storeExample.bind(this);
    this.retractExample = this.retractExample.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
    // IdleTimer
    this.idleTimer = null;
    // this.handleOnAction = this.handleOnAction.bind(this)
    // this.handleOnActive = this.handleOnActive.bind(this)
    this.handleOnIdle = this.handleOnIdle.bind(this);
  }
  getNewContext() {
    this.setState(
      { submitDisabled: true, generateDisabled: true, refreshDisabled: true },
      function () {
        // this.api.getRandomContext(this.state.taskId, this.state.task.cur_round, ['test'])
        this.api
          .getRandomContext(this.state.taskId, this.state.task.cur_round)
          .then((result) => {
            var randomTarget = Math.floor(
              Math.random() * this.state.task.targets.length
            );
            this.setState({
              target: randomTarget,
              context: result,
              content: [{ cls: "context", text: result.context }],
              submitDisabled: false,
              generateDisabled: false,
              refreshDisabled: false,
              exampleHistory: [
                {
                  timestamp: new Date().valueOf(),
                  answer: "",
                  question: "",
                  questionCacheId: null,
                  questionMetadata: null,
                  questionType: "",
                  activityType: "Context loaded",
                },
              ],
            });
          })
          .then(() => {
            // If answerSelect mode, generate
            if (this.experiment_mode["answerSelect"] !== "none") {
              this.handleGeneratorResponse();
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  }
  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.api
      .retractExample(
        this.state.mapKeyToExampleId[idx],
        this.props.providerWorkerId
      )
      .then((result) => {
        const newContent = this.state.content.slice();
        newContent[idx].cls = "retracted";
        newContent[idx].retracted = true;
        this.state.tries -= 1;
        this.setState({ content: newContent });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  handleTaskSubmit() {
    this.props.onSubmit(this.state);
  }
  handleModelResponse(e) {
    e.preventDefault();

    // MAXEDIT: to remove
    console.log(this.state.exampleHistory);

    if (
      this.experiment_mode["generator"] !== "none" &&
      this.state.numQuestionsGenerated <= 0
    ) {
      if (
        !window.confirm(
          'The question generator is there to assist you. Are you sure you want to continue without any question suggestions? If you would like a suggestion, click the "Generate Question" button.'
        )
      ) {
        return;
      }
    }

    this.setState(
      {
        progressSubmitting: true,
        submitDisabled: true,
        generateDisabled: true,
        refreshDisabled: true,
        hypothesisNotDetected: false,
      },
      function () {
        if (this.state.hypothesis.length == 0) {
          this.setState({
            progressSubmitting: false,
            submitDisabled: false,
            generateDisabled: false,
            refreshDisabled: false,
            hypothesisNotDetected: true,
          });
          return;
        }
        if (
          this.state.task.type == "extract" &&
          this.state.answer.length == 0 &&
          !this.state.generatedAnswer
        ) {
          this.setState({
            progressSubmitting: false,
            submitDisabled: false,
            generateDisabled: false,
            refreshDisabled: false,
            answerNotSelected: true,
          });
          return;
        }
        if (this.state.task.type == "extract") {
          if (this.state.generatedAnswer) {
            var answer_text = this.state.generatedAnswer;
          } else {
            var answer_text = "";
            if (this.state.answer.length > 0) {
              var last_answer = this.state.answer[this.state.answer.length - 1];
              var answer_text = last_answer.tokens.join(""); // NOTE: no spaces required as tokenising by word boundaries
              // Update the target with the answer text since this is defined by the annotator in QA (unlike NLI)
              this.setState({
                target: answer_text,
              });
            }
          }
        } else {
          var answer_text = null;
        }
        let modelInputs = {
          context: this.state.context.context,
          hypothesis: this.state.hypothesis,
          question: this.state.hypothesis,
          answer: answer_text,
          insight: false,
        };
        console.log("model_inputs: ");
        console.log(modelInputs);
        // this.model_url was this.state.task.round.url
        this.api
          .getModelResponse(this.model_url, modelInputs)
          .then((result) => {
            if (this.state.task.type != "extract") {
              var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
              var modelPredStr = this.state.task.targets[modelPredIdx];
              var modelFooled =
                result.prob.indexOf(Math.max(...result.prob)) !==
                this.state.target;
            } else {
              var modelPredIdx = null;
              var modelPredStr = result.answer;
              var modelFooled = result.eval_f1 < 0.4;
              var exactMatch = result.eval_exact >= 1;
              // TODO: Handle this more elegantly:
              result.prob = [result.conf, 1 - result.conf];
              this.state.task.targets = ["confidence", "uncertainty"];
            }
            console.log("Got result from model:");
            console.log(result);
            this.setState(
              {
                progressSubmitting: false,
                content: [
                  ...this.state.content,
                  {
                    index: this.state.content.length,
                    cls: "hypothesis",
                    modelInputs: modelInputs,
                    modelPredIdx: modelPredIdx,
                    modelPredStr: modelPredStr,
                    fooled: modelFooled,
                    text: this.state.hypothesis,
                    retracted: false,
                    exactMatch: exactMatch,
                    validated: null,
                    response: result,
                  },
                ],
              },
              function () {
                console.log("Setting state");
                if (
                  this.experiment_mode["adversary"] !== "none" &&
                  exactMatch
                ) {
                  console.log("Storing example");
                  this.storeExample();
                } else {
                  this.setState({
                    pendingExampleValidation: true,
                    generatedAnswer: null,
                  });
                }
              }
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  }
  storeExample() {
    this.setState(
      {
        progressSubmitting: true,
        submitDisabled: true,
        generateDisabled: true,
        refreshDisabled: true,
        hypothesisNotDetected: false,
      },
      function () {
        let last_example = this.state.content[this.state.content.length - 1];
        const old_model_version_response = {
          id: last_example.response.id,
          text: last_example.response.answer,
          prob: last_example.response.conf,
          model_is_correct: !last_example.response.fooled,
          eval_f1: last_example.response.eval_f1,
          eval_exact: last_example.response.eval_exact,
          signed: last_example.response.signed,
        };
        const metadata = {
          annotator_id: this.props.providerWorkerId,
          agentId: this.props.agentId,
          mephisto_id: this.props.mephistoWorkerId,
          assignmentId: this.props.assignmentId,
          current_timestamp: new Date().valueOf(),
          timer_elapsed_time_ms: this.idleTimer.getElapsedTime(),
          timer_active_time_ms: this.idleTimer.getTotalActiveTime(),
          timer_idle_time_ms: this.idleTimer.getTotalIdleTime(),
          model: "no-model",
          model_name: this.model_name,
          model_url: this.model_url,
          generator_name: this.generator_name,
          generator_url: this.generator_url,
          experiment_mode: this.experiment_mode,
          current_tries: this.state.tries,
          exampleHistory: JSON.stringify(this.state.exampleHistory),
          modelInputs: last_example.modelInputs,
          fullresponse: JSON.stringify(last_example.response),
          validated_by_annotator: last_example.validated,
        };
        console.log("metadata:");
        console.log(metadata);
        this.api
          .storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            "turk",
            this.state.context.id,
            this.state.hypothesis,
            this.state.target,
            old_model_version_response,
            metadata
          )
          .then((result) => {
            var key = this.state.content.length - 1;
            this.state.tries += 1;
            this.setState(
              {
                hypothesis: "",
                generatedAnswer: null,
                progressSubmitting: false,
                submitDisabled: false,
                generateDisabled: false,
                refreshDisabled: false,
                mapKeyToExampleId: {
                  ...this.state.mapKeyToExampleId,
                  [key]: result.id,
                },
                answer: [],
                answerNotSelected: true,
                exampleHistory: [],
              },
              function () {
                if (this.state.tries == this.state.total_tries) {
                  console.log("Success! You can submit the HIT");
                  this.setState({
                    taskCompleted: true,
                    generateDisabled: true,
                  });
                }
              }
            );
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  }
  handleGeneratorResponse(e) {
    if (e) {
      e.preventDefault();
    }

    this.setState(
      {
        progressGenerating: true,
        submitDisabled: true,
        generateDisabled: true,
        refreshDisabled: true,
        hypothesisNotDetected: false,
      },
      function () {
        if (
          this.state.task.type == "extract" &&
          this.experiment_mode["answerSelect"] === "none" &&
          this.state.answer.length == 0
        ) {
          this.setState({
            progressGenerating: false,
            submitDisabled: false,
            generateDisabled: false,
            refreshDisabled: false,
            answerNotSelected: true,
          });
          return;
        }
        if (
          this.state.task.type == "extract" &&
          this.experiment_mode["answerSelect"] === "none"
        ) {
          var answer_text = "";
          if (this.state.answer.length > 0) {
            var last_answer = this.state.answer[this.state.answer.length - 1];
            var answer_text = last_answer.tokens.join(""); // NOTE: no spaces required as tokenising by word boundaries
            // Update the target with the answer text since this is defined by the annotator in QA (unlike NLI)
            this.setState({
              target: answer_text,
            });
          }
        } else {
          var answer_text = "";
        }

        // Get last questionCacheId for a cached example for this answer
        var question_cache_id = -1;
        for (var i = this.state.exampleHistory.length - 1; i >= 0; i--) {
          let item = this.state.exampleHistory[i];
          if (
            item["answer"] == answer_text &&
            item["questionType"] == "cache"
          ) {
            question_cache_id = parseInt(item["questionCacheId"]);
            break;
          }
        }

        let curContext = this.state.context.context;
        let filterMode = this.experiment_mode["filterMode"];
        let modelInputs = {
          context: curContext,
          answer: answer_text,
          hypothesis: question_cache_id,
          question: question_cache_id,
          statement: this.experiment_mode["filterMode"],
          insight: "3|0.4|0.4", // generate 3 questions per request
        };

        console.log("model inputs:");
        console.log(modelInputs);

        this.api
          .getModelResponse(this.generator_url, modelInputs)
          .then((result) => {
            // if we have generated questions, we need to sort appropriately
            if (
              result["question_type"] === "generated" &&
              filterMode !== "" &&
              this.experiment_mode["answerSelect"] === "none"
            ) {
              // We need to get info from the QA model on how to filter
              let allModelInputs = result["questions"].map(function (q) {
                return {
                  context: curContext,
                  hypothesis: q,
                  question: q,
                  answer: answer_text,
                  insight: false,
                };
              });

              let outerContext = this;
              Promise.all(
                allModelInputs.map((x) =>
                  this.api.getModelResponse(this.model_url, x)
                )
              )
                .then(function (responses) {
                  // Get a JSON object from each of the responses
                  let merged = allModelInputs.map(function (el, i) {
                    return { ...el, ...responses[i] };
                  });
                  if (filterMode === "adversarial") {
                    merged.sort((a, b) => (a.eval_f1 > b.eval_f1 && 1) || -1);
                  } else if (filterMode === "uncertain") {
                    merged.sort((a, b) => (a.conf > b.conf && 1) || -1);
                  }

                  var question = merged[0].question;
                  outerContext.setState({
                    hypothesis: question,
                    progressGenerating: false,
                    submitDisabled: false,
                    generateDisabled: false,
                    refreshDisabled: false,
                    exampleHistory: [
                      ...outerContext.state.exampleHistory,
                      {
                        timestamp: new Date().valueOf(),
                        answer: answer_text,
                        question: question,
                        questionCacheId: result["question_cache_id"],
                        questionMetadata: merged,
                        questionType: result["question_type"], // cache or generated or manual
                        activityType: "Generated a question",
                      },
                    ],
                    numQuestionsGenerated:
                      outerContext.state.numQuestionsGenerated + 1,
                  });
                  return;
                })
                .catch(function (error) {
                  console.log(error);
                });
            } else {
              // Question comes from cache
              var question = result["questions"][0];
              var questionMetadata =
                "question_metadata" in result
                  ? result["question_metadata"]
                  : null;
              if (this.experiment_mode["answerSelect"] === "none") {
                var activityType = "Generated a question";
              } else {
                var activityType = "Generated a QA pair";
                answer_text = questionMetadata.ans;
                this.setState({
                  answer: [],
                  generatedAnswer: answer_text,
                  target: answer_text,
                  answerNotSelected: false,
                });
              }

              this.setState({
                hypothesis: question,
                progressGenerating: false,
                submitDisabled: false,
                generateDisabled: false,
                refreshDisabled: false,
                exampleHistory: [
                  ...this.state.exampleHistory,
                  {
                    timestamp: new Date().valueOf(),
                    answer: answer_text,
                    question: question,
                    questionCacheId: result["question_cache_id"],
                    questionMetadata: questionMetadata,
                    questionType: result["question_type"], // cache or generated or manual
                    activityType: activityType,
                  },
                ],
                numQuestionsGenerated: this.state.numQuestionsGenerated + 1,
              });
            }

            console.log("example history:");
            console.log(this.state.exampleHistory);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  }

  handleVerifyResponse(item_index, action) {
    console.log("Verifying Response");
    console.log(action);

    const newContent = this.state.content.slice();
    newContent[item_index].validated = action;
    this.setState({
      content: newContent,
      pendingExampleValidation: false,
    });
    this.storeExample();
  }

  handleResponseChange(e) {
    this.setState({
      hypothesis: e.target.value,
      exampleHistory: [
        ...this.state.exampleHistory,
        {
          timestamp: new Date().valueOf(),
          answer: "",
          question: e.target.value,
          questionCacheId: null,
          questionMetadata: null,
          questionType: "manual",
          activityType: "Question modified manually",
        },
      ],
    });
  }
  // handleOnAction (event) {
  //   console.log('user did something', event)
  // }
  // handleOnActive (event) {
  //   console.log('user is active', event)
  //   console.log('time remaining', this.idleTimer.getRemainingTime())
  // }
  handleOnIdle(event) {
    window.alert(
      'The system has not detected any activity in the past 60 seconds. Please click "OK" if you are still here.'
    );
    // console.log('user is idle', event)
    // console.log('last active', this.idleTimer.getLastActiveTime())
  }
  componentDidMount() {
    this.api
      .getTask(this.state.taskId)
      .then((result) => {
        result.targets = result.targets.split("|"); // split targets
        this.setState({ task: result }, function () {
          this.getNewContext();
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  updateAnswer(value) {
    // Only keep the last answer annotated
    if (value.length > 0) {
      this.setState({
        answer: [value[value.length - 1]],
        answerNotSelected: false,
        generatedAnswer: null,
        exampleHistory: [
          ...this.state.exampleHistory,
          {
            timestamp: new Date().valueOf(),
            answer: [value[value.length - 1]],
            question: "",
            questionCacheId: null,
            questionMetadata: null,
            questionType: "",
            activityType: "Answer changed",
          },
        ],
      });
    } else {
      this.setState({ answer: value, answerNotSelected: false });
    }
  }

  render() {
    let content_list = this.state.content;
    if (content_list.length > 1) {
      content_list = [content_list[0], ...content_list.slice(1).reverse()];
    }

    const content = content_list.map((item, index) =>
      item.cls == "context" ? (
        <ContextInfo
          key={index}
          index={item.index}
          text={item.text}
          targets={this.state.task.targets}
          curTarget={this.state.target}
          taskType={this.state.task.type}
          answer={this.state.answer}
          updateAnswer={this.updateAnswer}
        />
      ) : (
        <div
          key={index}
          className={
            item.cls +
            " rounded border " +
            (item.retracted
              ? "border-warning"
              : item.fooled || this.experiment_mode["adversary"] === "none"
              ? "border-success"
              : "border-danger")
          }
          style={{ borderWidth: 2 }}
        >
          <Row>
            <div className="col-sm-9">
              <div>
                Q{item.index}: <strong>{item.text}</strong>
              </div>
              <div>
                A{item.index}: <strong>{item.modelInputs.answer}</strong>
              </div>
              <small>
                {this.experiment_mode["adversary"] === "none" ? (
                  <>
                    <div>
                      {item.validated === null ? (
                        <>
                          <OverlayTrigger
                            placement="top"
                            delay={{ show: 250, hide: 400 }}
                            overlay={
                              <Tooltip id={`tooltip-confirm`}>
                                This helps us speed up validation and pay
                                bonuses out quicker!
                              </Tooltip>
                            }
                          >
                            <FaInfoCircle />
                          </OverlayTrigger>
                          &nbsp; Can you please confirm that "
                          <strong>{item.modelInputs.answer}</strong>" is the
                          correct answer to the question and that it is in line
                          with the instructions? &nbsp;
                          <InputGroup className="mt-1">
                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-valid`}>
                                  My answer is correct!
                                </Tooltip>
                              }
                            >
                              <Button
                                className="btn btn-success mr-1"
                                style={{ padding: "0.2rem 0.5rem" }}
                                onClick={() =>
                                  this.handleVerifyResponse(item.index, "valid")
                                }
                                disabled={this.state.verifyDisabled}
                              >
                                <FaThumbsUp style={{ marginTop: "-0.25em" }} />{" "}
                                Valid
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-invalid`}>
                                  My answer is not valid.
                                </Tooltip>
                              }
                            >
                              <Button
                                className="btn btn-danger mr-1"
                                style={{ padding: "0.2rem 0.5rem" }}
                                onClick={() =>
                                  this.handleVerifyResponse(
                                    item.index,
                                    "invalid"
                                  )
                                }
                                disabled={this.state.verifyDisabled}
                              >
                                <FaThumbsDown
                                  style={{ marginTop: "-0.25em" }}
                                />{" "}
                                Invalid
                              </Button>
                            </OverlayTrigger>
                          </InputGroup>
                        </>
                      ) : (
                        <>
                          <span>
                            Thank you for validating your example as:{" "}
                            <strong>{item.validated}</strong>. You may now
                            {item.index == this.state.total_tries
                              ? " submit the HIT!"
                              : " ask another question."}
                          </span>
                          <br />
                        </>
                      )}
                    </div>
                  </>
                ) : item.fooled ? (
                  <>
                    <span>
                      The AI predicted <strong>{item.modelPredStr}</strong>{" "}
                      instead.
                    </span>
                    <br />
                    <hr />
                    <div>
                      {item.validated === null ? (
                        <>
                          <OverlayTrigger
                            placement="top"
                            delay={{ show: 250, hide: 400 }}
                            overlay={
                              <Tooltip id={`tooltip-confirm`}>
                                This helps us speed up validation and pay
                                bonuses out quicker!
                              </Tooltip>
                            }
                          >
                            <FaInfoCircle />
                          </OverlayTrigger>
                          &nbsp; Can you please confirm that "
                          <strong>{item.modelInputs.answer}</strong>" is the
                          correct answer to the question and that the model's
                          prediction "<strong>{item.modelPredStr}</strong>" is
                          wrong? &nbsp;
                          <InputGroup className="mt-1">
                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-valid`}>
                                  My answer is correct and the AI is wrong!
                                </Tooltip>
                              }
                            >
                              <Button
                                className="btn btn-success mr-1"
                                style={{ padding: "0.2rem 0.5rem" }}
                                onClick={() =>
                                  this.handleVerifyResponse(item.index, "valid")
                                }
                                disabled={this.state.verifyDisabled}
                              >
                                <FaThumbsUp style={{ marginTop: "-0.25em" }} />{" "}
                                Valid
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-invalid`}>
                                  The AI also managed to predict the correct
                                  answer (or my original answer was not valid).
                                </Tooltip>
                              }
                            >
                              <Button
                                className="btn btn-danger mr-1"
                                style={{ padding: "0.2rem 0.5rem" }}
                                onClick={() =>
                                  this.handleVerifyResponse(
                                    item.index,
                                    "invalid"
                                  )
                                }
                                disabled={this.state.verifyDisabled}
                              >
                                <FaThumbsDown
                                  style={{ marginTop: "-0.25em" }}
                                />{" "}
                                Invalid
                              </Button>
                            </OverlayTrigger>
                          </InputGroup>
                        </>
                      ) : (
                        <>
                          <span>
                            Thank you for validating your example as:{" "}
                            <strong>{item.validated}</strong>. You may now
                            {item.index == this.state.total_tries
                              ? " submit the HIT!"
                              : " ask another question."}
                          </span>
                          <br />
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span>
                      The AI correctly predicted{" "}
                      <strong>{item.modelPredStr}</strong>. Please try again.
                    </span>
                    {item.exactMatch ? (
                      <>
                        {" "}
                        You may now
                        {item.index == this.state.total_tries
                          ? " submit the HIT!"
                          : " ask another question."}
                      </>
                    ) : (
                      <>
                        <br />
                        <hr />
                        <div>
                          {item.validated === null ? (
                            <>
                              <OverlayTrigger
                                placement="top"
                                delay={{ show: 250, hide: 400 }}
                                overlay={
                                  <Tooltip id={`tooltip-confirm`}>
                                    This helps us speed up validation and pay
                                    bonuses out quicker!
                                  </Tooltip>
                                }
                              >
                                <FaInfoCircle />
                              </OverlayTrigger>
                              <>
                                &nbsp; Our automated evaluation isn't always
                                perfect. If you think that your answer (
                                <strong>{item.modelInputs.answer}</strong>) is
                                correct <b>AND</b> that the AI's prediction (
                                <strong>{item.modelPredStr}</strong>) is wrong,
                                please click the <i>"No, I Beat the AI!"</i>{" "}
                                button below. &nbsp;
                              </>
                              <InputGroup className="mt-1">
                                <OverlayTrigger
                                  placement="bottom"
                                  delay={{ show: 50, hide: 150 }}
                                  overlay={
                                    <Tooltip id={`tooltip-valid`}>
                                      Yes, the AI also managed to predict the
                                      correct answer.
                                    </Tooltip>
                                  }
                                >
                                  <Button
                                    className="btn btn-success mr-1"
                                    style={{ padding: "0.2rem 0.5rem" }}
                                    onClick={() =>
                                      this.handleVerifyResponse(
                                        item.index,
                                        "modelfooled_validation_correct"
                                      )
                                    }
                                    disabled={this.state.verifyDisabled}
                                  >
                                    <FaThumbsUp
                                      style={{ marginTop: "-0.25em" }}
                                    />{" "}
                                    Yes, the AI is correct
                                  </Button>
                                </OverlayTrigger>

                                <OverlayTrigger
                                  placement="bottom"
                                  delay={{ show: 50, hide: 150 }}
                                  overlay={
                                    <Tooltip id={`tooltip-invalid`}>
                                      No, my answer is correct and the AI is
                                      wrong!
                                    </Tooltip>
                                  }
                                >
                                  <Button
                                    className="btn btn-danger mr-1"
                                    style={{ padding: "0.2rem 0.5rem" }}
                                    onClick={() =>
                                      this.handleVerifyResponse(
                                        item.index,
                                        "modelfooled_validation_wrong"
                                      )
                                    }
                                    disabled={this.state.verifyDisabled}
                                  >
                                    <FaThumbsDown
                                      style={{ marginTop: "-0.25em" }}
                                    />{" "}
                                    No, I Beat the AI!
                                  </Button>
                                </OverlayTrigger>

                                <OverlayTrigger
                                  placement="bottom"
                                  delay={{ show: 50, hide: 150 }}
                                  overlay={
                                    <Tooltip id={`tooltip-invalid`}>
                                      I made a mistake, this example is invalid.
                                    </Tooltip>
                                  }
                                >
                                  <Button
                                    className="btn btn-light mr-1"
                                    style={{ padding: "0.2rem 0.5rem" }}
                                    onClick={() =>
                                      this.handleVerifyResponse(
                                        item.index,
                                        "modelfooled_invalid"
                                      )
                                    }
                                    disabled={this.state.verifyDisabled}
                                  >
                                    <FaThumbsDown
                                      style={{ marginTop: "-0.25em" }}
                                    />{" "}
                                    Invalid Example
                                  </Button>
                                </OverlayTrigger>
                              </InputGroup>
                            </>
                          ) : (
                            <>
                              <span>
                                {item.validated ===
                                "modelfooled_validation_correct"
                                  ? "Thank you for validating that the AI answer is correct. "
                                  : item.validated ===
                                    "modelfooled_validation_wrong"
                                  ? "Thank you for validating that the AI answer is wrong and that yours is correct. "
                                  : item.validated === "modelfooled_invalid"
                                  ? "Thank you for notifying us that this example is invalid. "
                                  : null}
                                You may now
                                {item.index == this.state.total_tries
                                  ? " submit the HIT!"
                                  : " ask another question."}
                              </span>
                              <br />
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </small>
            </div>
            {this.experiment_mode["adversary"] === "none" ? null : (
              <div className="col-sm-3" style={{ textAlign: "right" }}>
                <small>
                  <em>AI Confidence:</em>
                </small>
                <ProgressBar
                  striped
                  variant="success"
                  now={(item.response.prob[0] * 100).toFixed(1)}
                  label={`${(item.response.prob[0] * 100).toFixed(1)}%`}
                />
              </div>
            )}
          </Row>
        </div>
      )
    );
    if (this.state.taskCompleted) {
      var taskTracker = (
        <Button
          className="btn btn-primary btn-success mt-2"
          onClick={this.handleTaskSubmit}
        >
          Submit HIT
        </Button>
      );
    } else {
      var taskTracker = (
        <small style={{ marginTop: "18px" }}>
          &nbsp;Questions submitted:{" "}
          <strong>
            {this.state.tries}/{this.state.total_tries}
          </strong>
        </small>
      );
    }

    var errorMessage = "";
    if (this.state.hypothesisNotDetected === true) {
      var errorMessage = (
        <div>
          <small style={{ color: "red" }}>* Please enter a question</small>
        </div>
      );
    }
    if (
      this.state.answerNotSelected === true &&
      this.experiment_mode["answerSelect"] === "none"
    ) {
      var errorMessage = (
        <div>
          <small style={{ color: "red" }}>
            * Please select an answer from the passage
          </small>
        </div>
      );
    }
    if (this.state.pendingExampleValidation === true) {
      var errorMessage = (
        <div>
          <small style={{ color: "red" }}>
            * Please validate the example above by clicking the green button for
            a valid example or the red button for an invalid one.
          </small>
        </div>
      );
    }
    return (
      <Container>
        <IdleTimer
          ref={(ref) => {
            this.idleTimer = ref;
          }}
          timeout={1000 * 60 * 1} // last number is value in minutes
          onActive={this.handleOnActive}
          onIdle={this.handleOnIdle}
          onAction={this.handleOnAction}
          debounce={250}
        />
        <Row>
          <CardGroup style={{ marginTop: 4, width: "100%" }}>
            <Card border="dark">
              <Card.Body style={{ height: 540, overflowY: "scroll" }}>
                {content}
              </Card.Body>
            </Card>
          </CardGroup>
          <InputGroup className="mt-3">
            <FormControl
              autoFocus
              placeholder={
                this.state.task.type == "extract"
                  ? "Ask a question.."
                  : "Type your question.."
              }
              value={this.state.hypothesis}
              onChange={this.handleResponseChange}
              disabled={this.state.taskCompleted}
              required
            />

            {this.experiment_mode["generator"] === "none" ? null : (
              <InputGroup.Append>
                <Button
                  id="generate"
                  className="btn btn-info mr-1"
                  onClick={this.handleGeneratorResponse}
                  disabled={this.state.generateDisabled}
                >
                  {this.experiment_mode["answerSelect"] === "none"
                    ? "Generate Question"
                    : "Generate Question & Answer"}
                  {this.state.progressGenerating ? (
                    <Spinner
                      className="ml-2"
                      animation="border"
                      role="status"
                      size="sm"
                    />
                  ) : null}
                </Button>
              </InputGroup.Append>
            )}
          </InputGroup>

          {this.experiment_mode["adversary"] === "none" ? null : (
            <div>
              {this.experiment_mode["answerSelect"] !== "none" &&
              this.state.generatedAnswer ? (
                <p>
                  <i>Answer:</i> <b>{this.state.generatedAnswer}</b>
                  <br />
                  <small className="form-text" style={{ color: "red" }}>
                    <b>
                      If the suggested answer is wrong, please select the
                      correct answer by highlighting it in the passage above.
                    </b>
                  </small>
                </p>
              ) : null}
              <p>
                <small className="form-text text-muted">
                  Remember, the goal is to find an example that the AI gets
                  wrong but that another person would get right. Load time may
                  be slow; please be patient.
                </small>
              </p>
            </div>
          )}

          {errorMessage}
          <InputGroup>
            {this.state.taskCompleted ? null : (
              <Button
                className="btn btn-primary mt-2 mr-1"
                onClick={this.handleModelResponse}
                disabled={this.state.submitDisabled}
              >
                Submit Question
                {this.state.progressSubmitting ? (
                  <Spinner
                    className="ml-2"
                    animation="border"
                    role="status"
                    size="sm"
                  />
                ) : null}
              </Button>
            )}
            {taskTracker}
            {this.experiment_mode["adversary"] === "none" ? null : (
              <small className="mt-1 mb-1">
                *Kindly note that validation is a manual process meaning that
                bonuses will take a few days to be processed. We thank you in
                advance for your understanding and patience.
              </small>
            )}
          </InputGroup>
        </Row>
      </Container>
    );
  }
}

export { CreateInterface };
