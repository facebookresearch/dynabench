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
    return (
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
    )
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
      // extraLogging: props.taskConfig.extra_logging,
      task: {},
      context: null,
      answerText: null,
      modelPredIdx: null,
      modelPredStr: "",
      question: "",
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
            result.context = JSON.parse(result.context_json).context;
            this.setState({
              answerText: null,
              context: result,
              content: [{ cls: "context", text: result.context }],
              submitDisabled: false,
              generateDisabled: false,
              refreshDisabled: false,
              exampleHistory: [
                {
                  timestamp: new Date().valueOf(),
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

  getTagList(props) {
    if (props.taskConfig && props.taskConfig.fetching_tags) {
      return props.taskConfig.fetching_tags.split(",");
    } else {
      return [];
    }
  }

  getLoggingTags(context, props) {
    let input_context_tags = this.getTagList(props);
    const extra_input_logging = props.taskConfig.extra_logging;
    if (extra_input_logging === null || extra_input_logging.length === 0) {
      return { input_context_tags: input_context_tags };
    }

    let extra_logging_list = extra_input_logging.split(";");
    const extra_logging = {};
    extra_logging_list.forEach((entry) => {
      if (entry === null || entry.length === 0) {
        return;
      }
      let key_values = entry.split(":");
      if (key_values.length < 2) {
        return;
      }
      let values = key_values[1].split(",");
      values = values.filter((value) => value.length > 0);
      extra_logging[key_values[0]] = values;
    });
    return {
      // current_context_tag: context.tag,
      current_context_tag: "",
      input_context_tags: input_context_tags,
      input_extra_info: extra_logging,
    };
  }

  getUserInputTag(extra) {
    let input_info = extra.input_extra_info;
    let tagToStoreWithExamples = input_info
      ? input_info.tag_to_store_with_examples
      : [];
    if (tagToStoreWithExamples.length > 0) {
      return tagToStoreWithExamples[0];
    }
    return null;
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

    // console.log(this.state.exampleHistory);

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
        questionNotDetected: false,
        answerNotSelected: false,
      },
      function () {
        if (this.state.question.length == 0) {
          this.setState({
            progressSubmitting: false,
            submitDisabled: false,
            generateDisabled: false,
            refreshDisabled: false,
            questionNotDetected: true,
          });
          return;
        }
        if (
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
        
        if (this.state.generatedAnswer) {
          var answer_text = this.state.generatedAnswer.ans;
        } else {
          var answer_text = "";
          if (this.state.answer.length > 0) {
            var last_answer = this.state.answer[this.state.answer.length - 1];
            var answer_text = last_answer.tokens.join("").trim(); // NOTE: no spaces required as tokenising by word boundaries
            this.setState({
              answerText: answer_text,
            });
          }
        }
        let modelInputs = {
          context: this.state.context.context,
          hypothesis: this.state.question,
          question: this.state.question,
          answer: answer_text,
          insight: false,
        };
        // console.log("Model_inputs: ");
        // console.log(modelInputs);
        // this.model_url was this.state.task.round.url
        this.api
          .getModelResponse(this.model_url, modelInputs)
          .then((result) => {
            var modelPredIdx = null;
            var modelPredStr = result.answer;
            var modelFooled = result.eval_f1 <= 0.4;
            var exactMatch = result.eval_exact >= 1;
            // TODO: Handle this more elegantly:
            result.prob = [result.conf, 1 - result.conf];

            // console.log("Got result from model: ");
            // console.log(result);
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
                    text: this.state.question,
                    retracted: false,
                    exactMatch: exactMatch,
                    validated: null,
                    response: result,
                  },
                ],
              },
              function () {
                if (
                  this.experiment_mode["adversary"] !== "none" && exactMatch
                ) {
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
        questionNotDetected: false,
        answerNotSelected: false,
      },
      function () {
        let last_example = this.state.content[this.state.content.length - 1];
        const model_output = {
          id: last_example.response.id,
          text: last_example.response.answer,
          answer: last_example.response.answer,
          conf: last_example.response.conf,
          prob: last_example.response.conf,
          model_is_correct: !last_example.fooled,
          eval_f1: last_example.response.eval_f1,
          eval_exact: last_example.response.eval_exact,
          signed: last_example.response.signature,
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
          modelInputs: last_example.modelInputs,
          modelOutput: model_output,
          fullresponse: JSON.stringify(last_example.response),
          annotatorValidation: last_example.validated,
          requiresValidation: last_example.response.eval_f1 <= 0.6 || (this.experiment_mode["adversary"] !== "none" && last_example.validated == "valid"),  // i.e. modelWrong
          exampleHistory: JSON.stringify(this.state.exampleHistory),
        };
        let extra = this.getLoggingTags(this.state.context, this.props);
        let tag = this.getUserInputTag(extra);

        console.log("for validation?: " + metadata.requiresValidation.toString());
        this.api
          .storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            "turk",
            this.state.context.id,
            {answer: last_example.modelInputs.answer, question: last_example.modelInputs.question},
            model_output,
            model_output.signed,
            metadata,
            metadata.requiresValidation,
            tag,
            this.model_url.replace("https://obws766r82.execute-api.us-west-1.amazonaws.com/predict?model=", "")
          )
          .then((result) => {
            var key = this.state.content.length - 1;
            this.state.tries += 1;
            this.setState(
              {
                question: "",
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
        questionNotDetected: false,
        answerNotSelected: false,
      },
      function () {
        if (
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
          this.experiment_mode["answerSelect"] === "none"
        ) {
          var answer_text = "";
          if (this.state.answer.length > 0) {
            var last_answer = this.state.answer[this.state.answer.length - 1];
            var answer_text = last_answer.tokens.join("").trim(); // NOTE: no spaces required as tokenising by word boundaries
            this.setState({
              answerText: answer_text,
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
            "answer" in item && item["answer"] == answer_text &&
            "questionType" in item && item["questionType"] == "cache"
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
          statement: this.experiment_mode["filterMode"],
          insight: "3|0.4|0.4", // generate 3 questions per request
        };

        // console.log("Model inputs:");
        // console.log(modelInputs);

        this.api
          .getModelResponse(this.generator_url, modelInputs)
          .then((result) => {
            // console.log("Generator response:");
            // console.log(result)
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
                  if ("context" in merged) {
                    delete merged["context"];
                  }
                  outerContext.setState({
                    question: question,
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
              if ("context" in questionMetadata) {
                delete questionMetadata["context"];
              }

              if (this.experiment_mode["answerSelect"] === "none") {
                var activityType = "Generated a question";
              } else {
                var activityType = "Generated a QA pair";
                var ans_char_start = questionMetadata.metadata_gen.answer_start;
                var ans_char_end = questionMetadata.metadata_gen.answer_end;
                var tokens = this.state.context.context.split(/\b|(?<=[\s\(\)])|(?=[\s\(\)])/);
                var char_to_token_map = [];
                for (let token_id = 0; token_id < tokens.length; token_id++) {
                  for (var char_id = 0; char_id < tokens[token_id].length; char_id++) {
                    char_to_token_map.push(token_id);
                  }
                }
                var ans_start = char_to_token_map[ans_char_start];
                var ans_end = char_to_token_map[ans_char_end];
                var answerObj = [{ start: ans_start, end: ans_end, tag: "ANS" }];

                this.setState({
                  answer: answerObj,
                  generatedAnswer: questionMetadata,
                  answerText: answer_text,
                  answerNotSelected: false,
                });
              }

              this.setState({
                question: question,
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

            // console.log("Example history:");
            // console.log(this.state.exampleHistory);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    );
  }

  handleVerifyResponse(item_index, action) {
    console.log("Verifying Response: " + action);

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
      question: e.target.value,
      exampleHistory: [
        ...this.state.exampleHistory,
        {
          timestamp: new Date().valueOf(),
          question: e.target.value,
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
        generatedAnswer: null,
        exampleHistory: [
          ...this.state.exampleHistory,
          {
            timestamp: new Date().valueOf(),
            answer: [value[value.length - 1]],
            activityType: "Answer changed",
          },
        ],
      });
    } else {
      this.setState({ answer: value });
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
                                Thanks, this helps us speed up validation!
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
                ) : item.exactMatch ? (
                  <>
                    <span>
                      <strong>Bad luck!</strong> The AI correctly predicted{" "}
                      <strong>{item.modelPredStr}</strong>. Please try to beat it again.
                    </span>
                    <>
                      {" "}
                      You may now
                      {item.index == this.state.total_tries
                        ? " submit the HIT!"
                        : " ask another question."}
                    </>
                  </>
                ) : (
                  <>
                    <span>
                      The AI predicted "<strong>{item.modelPredStr}</strong>".
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
                          &nbsp; You answered "
                          <strong>{item.modelInputs.answer}</strong>" and the
                          AI predicted "<strong>{item.modelPredStr}</strong>".
                          Please help us validate this example: &nbsp;
                          <InputGroup className="mt-1">
                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-valid`}>
                                  My answer is correct and the AI's answer is incorrect.
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
                                I beat the AI!
                              </Button>
                            </OverlayTrigger>

                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 50, hide: 150 }}
                              overlay={
                                <Tooltip id={`tooltip-invalid`}>
                                  My answer is correct but the AI also managed to predict a valid answer.
                                </Tooltip>
                              }
                            >
                              <Button
                                className="btn btn-warning mr-1"
                                style={{ padding: "0.2rem 0.5rem" }}
                                onClick={() =>
                                  this.handleVerifyResponse(
                                    item.index,
                                    "model_ans_correct"
                                  )
                                }
                                disabled={this.state.verifyDisabled}
                              >
                                <FaThumbsDown
                                  style={{ marginTop: "-0.25em" }}
                                />{" "}
                                The AI’s answer is also valid
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
                                        "invalid"
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
                            {item.validated === "valid"
                              ? "Thank you for validating that you successfully beat the AI! "
                              : item.validated === "model_ans_correct"
                              ? "Thank you for validating your answer is correct and that the AI is also correct. "
                              : item.validated === "invalid"
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
    if (this.state.questionNotDetected === true) {
      var errorMessage = (
        <small style={{ color: "red" }}>* Please enter a question</small>
      );
    }
    if (
      this.state.answerNotSelected === true &&
      (this.experiment_mode["answerSelect"] === "none" || !this.state.generatedAnswer)
    ) {
      var errorMessage = (
        <small style={{ color: "red" }}>
          * Please select an answer from the passage
        </small>
      );
    }
    if (this.state.pendingExampleValidation === true) {
      var errorMessage = (
        <small style={{ color: "red" }}>
          * Please validate the example by clicking one of the buttons shown above.
        </small>
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
              placeholder="Ask a question.."
              value={this.state.question}
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
            <div className="mb-2">
              {this.experiment_mode["answerSelect"] !== "none" &&
              this.state.generatedAnswer ? (
                <p>
                  <i>Generated Answer:</i> <b>{this.state.generatedAnswer.ans}</b>
                  <br />
                  <small className="form-text" style={{ color: "red" }}>
                    <b>
                      If the suggested answer is wrong, please select the
                      correct answer by highlighting it in the passage above.
                    </b>
                  </small>
                </p>
              ) : null}
                <small className="form-text text-muted">
                  Remember, the goal is to find an example that the AI gets
                  wrong but that another person would get right. Load time may
                  be slow; please be patient.
                </small>
                {errorMessage}
            </div>
          )}

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
          </InputGroup>
          {this.experiment_mode["adversary"] === "none" ? null : (
            <small className="mt-1 mb-1">
              *Kindly note that validation is a manual process meaning that
              bonuses will take a few days to be processed. We thank you in
              advance for your understanding and patience.
            </small>
          )}
        </Row>
      </Container>
    );
  }
}

export { CreateInterface };
