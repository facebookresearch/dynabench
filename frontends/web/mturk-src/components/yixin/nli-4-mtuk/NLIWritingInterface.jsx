/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Button, Container } from "react-bootstrap";

import { ExampleGoodCards } from "./GoodExampleCards.jsx";

class NLIWritingInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      // here comes the new state,

      // the data from the requester.
      reqData: {
        dataId: "",
        passage: "",
        targetLabel: 2, //0, 1, 2
      },

      // the data of the responser/annotator.
      resData: {
        statement: "",
        labelExplanation: "",
        modelExplanation: "",
      },

      modelData: {
        prob: [], //E, N, C
        predLabel: null, //0, 1, 2
      },

      showPreview: false,
      submittedOnce: false,
      submitDisabled: true,
      modelFooled: false,
      modelCalculating: false,

      requestStartTime: null,
      chanceToSwitch: 10,

      // other states
      answer: [],
      taskId: props.taskConfig.task_id,
      task: {},
      context: null,
      target: 0,
      modelPredIdx: null,
      modelPredStr: "",
      hypothesis: "",
      content: [],

      refreshDisabled: true,
      mapKeyToExampleId: {},
      tries: 0,
      total_tries: 10, // NOTE: Set this to your preferred value
      taskCompleted: false,
    };

    this.getNewContext = this.getNewContext.bind(this);
    this.handleTaskSubmit = this.handleTaskSubmit.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    // this.retractExample = this.retractExample.bind(this);
    // this.updateAnswer = this.updateAnswer.bind(this);
  }

  InitNewContext() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, function () {
      this.api
        .getRandomContext(this.state.taskId, this.state.task.cur_round)
        .then(
          (result) => {
            const randomID = Math.floor(Math.random() * 100);
            const randomTarget = Math.floor(Math.random() * 3);
            // this.setState({target: randomTarget, context: result, content: [{cls: 'context', text: result.context}], submitDisabled: false, refreshDisabled: false});
            console.log("Init Context...");
            // console.log(result)
            const newReqData = {
              dataId: result.id,
              passage: result.context,
              targetLabel: randomTarget, //0, 1, 2
            };
            // console.log(newReqData)
            this.setState({
              reqData: newReqData,
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

  getNewContext() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, function () {
      this.api
        .getRandomContext(this.state.taskId, this.state.task.cur_round)
        .then(
          (result) => {
            var randomTarget = Math.floor(
              Math.random() * this.state.task.targets.length
            );
            this.setState({
              target: randomTarget,
              context: result,
              content: [{ cls: "context", text: result.context }],
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

  handleTaskSubmit() {
    this.props.onSubmit(this.state.content);
  }

  handleResponse() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, function () {
      if (this.state.hypothesis.length == 0) {
        this.setState({ submitDisabled: false, refreshDisabled: false });
        return;
      }
      if (this.state.task.type == "extract" && this.state.answer.length == 0) {
        this.setState({ submitDisabled: false, refreshDisabled: false });
        return;
      }
      if (this.state.task.type == "extract") {
        var answer_text = "";
        if (this.state.answer.length > 0) {
          var last_answer = this.state.answer[this.state.answer.length - 1];
          var answer_text = last_answer.tokens.join(" "); // NOTE: no spaces required as tokenising by word boundaries
          // Update the target with the answer text since this is defined by the annotator in QA (unlike NLI)
          this.setState({ target: answer_text });
        }
      } else {
        var answer_text = null;
      }
      let modelInputs = {
        context: this.state.context.context,
        hypothesis: this.state.hypothesis,
        answer: answer_text,
        insight: false,
      };
      this.api.getModelResponse(this.state.task.round.url, modelInputs).then(
        (result) => {
          if (this.state.task.type != "extract") {
            var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
            var modelPredStr = this.state.task.targets[modelPredIdx];
            var modelFooled =
              result.prob.indexOf(Math.max(...result.prob)) !==
              this.state.target;
          } else {
            var modelPredIdx = null;
            var modelPredStr = result.text;
            var modelFooled = !result.model_is_correct;
            // TODO: Handle this more elegantly:
            result.prob = [result.prob, 1 - result.prob];
            this.state.task.targets = ["confidence", "uncertainty"];
          }
          this.setState(
            {
              content: [
                ...this.state.content,
                {
                  cls: "hypothesis",
                  modelPredIdx: modelPredIdx,
                  modelPredStr: modelPredStr,
                  fooled: modelFooled,
                  text: this.state.hypothesis,
                  retracted: false,
                  response: result,
                },
              ],
            },
            function () {
              var last_answer = this.state.answer[this.state.answer.length - 1];
              var answer_text = last_answer.tokens.join(" ");
              const metadata = {
                annotator_id: this.props.providerWorkerId,
                mephisto_id: this.props.mephistoWorkerId,
                model: "model-name-unknown",
                agentId: this.props.agentId,
                assignmentId: this.props.assignmentId,
                fullresponse:
                  this.state.task.type == "extract"
                    ? JSON.stringify(this.state.answer)
                    : this.state.target,
              };
              this.api
                .storeExample(
                  this.state.task.id,
                  this.state.task.cur_round,
                  "turk",
                  this.state.context.id,
                  this.state.hypothesis,
                  this.state.task.type == "extract"
                    ? answer_text
                    : this.state.target,
                  result,
                  metadata
                )
                .then(
                  (result) => {
                    var key = this.state.content.length - 1;
                    this.state.tries += 1;
                    this.setState(
                      {
                        hypothesis: "",
                        submitDisabled: false,
                        refreshDisabled: false,
                        mapKeyToExampleId: {
                          ...this.state.mapKeyToExampleId,
                          [key]: result.id,
                        },
                      },
                      function () {
                        if (
                          this.state.content[this.state.content.length - 1]
                            .fooled ||
                          this.state.tries >= this.state.total_tries
                        ) {
                          console.log("Success! You can submit HIT");
                          this.setState({ taskCompleted: true });
                        }
                      }
                    );
                  },
                  (error) => {
                    console.log(error);
                  }
                );
            }
          );
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }

  handleResponseChange(e) {
    this.setState({ hypothesis: e.target.value });
  }

  componentDidMount() {
    this.api.getTask(this.state.taskId).then(
      (result) => {
        result.targets = result.targets.split("|"); // split targets
        this.setState({ task: result }, function () {
          // this.getNewContext();
          this.InitNewContext();
          console.log(this.state);
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  submitStatementFake = () => {
    this.setState({
      modelCalculating: true,
      submittedOnce: true,
      submitDisabled: true,
    });

    const randomArray = [Math.random(), Math.random(), Math.random()];
    let sum = randomArray.reduce(function (a, b) {
      return a + b;
    }, 0);
    const modelProb = randomArray.map((a) => {
      return a / sum;
    });

    const modelPredLabel = modelProb.indexOf(Math.max(...modelProb));

    const newModelData = {
      prob: modelProb, //E, N, C
      predLabel: modelPredLabel, //0, 1, 2
    };

    setTimeout(() => {
      this.setState({
        modelData: newModelData,
        submittedOnce: true,
        modelCalculating: false,
        submitDisabled: false,
      });
    }, 1000);

    this.checkModelFeedback();
    console.log("Check Model", this.state);
  };

  checkModelFeedback = () => {
    if (this.state.modelData.predLabel === this.state.reqData.targetLabel) {
      this.setState({ modelFooled: true });
    }
  };

  switchContext = () => {
    if (this.state.chanceToSwitch > 0) {
      this.setState({ chanceToSwitch: this.state.chanceToSwitch - 1 });
      this.InitNewContext();
    }
  };

  render() {
    const labelDescMapping = {
      0: "definitely correct",
      1: "neither correct nor incorrect",
      2: "definitely incorrect",
    };

    const targetLabelDesc = `${
      labelDescMapping[this.state.reqData.targetLabel]
    }`;

    // model feedback panel
    let modelFeedBack = <></>;
    if (this.state.submittedOnce) {
      let modelResult = (
        <ul>
          <li>
            Definitely Correct:{" "}
            {(this.state.modelData.prob[0] * 100).toFixed(2)} %
          </li>
          <li>
            Definitely Incorrect:{" "}
            {(this.state.modelData.prob[2] * 100).toFixed(2)} %
          </li>
          <li>Neither: {(this.state.modelData.prob[1] * 100).toFixed(2)} %</li>
        </ul>
      );
      if (this.state.modelCalculating) {
        modelResult = (
          <>
            <div>AI is thinking...</div>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">AI is thinking...</span>
            </div>
          </>
        );
      }

      modelFeedBack = (
        <>
          <strong>The AI system thinks that the statement is:</strong>
          <div style={{ color: "blue" }}>{modelResult}</div>
        </>
      );
    }
    // end model feedback panel

    // depend on the model feedback, we give different instruction
    let feedBackDesc = <></>;
    if (
      !this.state.modelCalculating &&
      this.state.submittedOnce &&
      !this.state.modelFooled
    ) {
      feedBackDesc = (
        <>
          <div style={{ color: "red" }}>
            <strong>
              Nice try! However, the AI got it correct. Try to modify your
              statement and fool the AI again.
            </strong>
          </div>
        </>
      );
    } else if (
      !this.state.modelCalculating &&
      this.state.submittedOnce &&
      this.state.modelFooled
    ) {
      feedBackDesc = (
        <>
          <div style={{ color: "red" }}>
            <strong>Great! You successfully fooled the AI.</strong> <br />
            Now, please review your statement carefully to make sure that the
            statement belongs to the right category and your explanation is also
            correct (you can still edit your explanations but you cannot edit
            your statement now).
          </div>
        </>
      );
    }

    let operationPanel = (
      <>
        <div>
          Once you finished, you can click the <strong>Submit</strong> button to
          see what the AI thinks.
          <br />
          <Button
            className="btn btn-primary btn-success"
            onClick={this.submitStatementFake}
            disabled={this.state.submitDisabled}
          >
            Submit Statement
          </Button>
        </div>
        <div>
          If you find it too hard to fool the AI, we can click the{" "}
          <strong>Switch Passage</strong> button to switch to another Passage.
          <br />
          <Button
            className="btn btn-primary btn-success"
            onClick={this.switchContext}
            disabled={this.state.submitDisabled}
          >
            Switch Passage
          </Button>
          <br />
          You have <strong>{this.state.chanceToSwitch}</strong> chances
          remaining to switch the passage.
        </div>
      </>
    );
    if (this.state.modelFooled) {
      operationPanel = (
        <>
          <div>
            If you think that your statement belongs to the right category and
            all your input is good, you can click the <strong>Finish</strong>{" "}
            button to finish the HIT.
            <br />
            <Button className="btn btn-primary btn-success" onClick={() => {}}>
              Finish
            </Button>
          </div>
          <div>
            If you find that your made a mistake and your statement belongs to
            the wrong category, please click the <strong>Retract</strong> button
            below to retract your last input.
            <br />
            <Button className="btn btn-primary btn-success" onClick={() => {}}>
              Retract
            </Button>
            <br />
          </div>
        </>
      );
    }

    const collectionPanel = (
      <>
        <div className="card">
          <div className="card-body">
            {/*<h5 className="card-title">Main Task</h5>*/}
            <div className="card-text">
              <strong>Passage:</strong>
              <div style={{ color: "blue" }}>{this.state.reqData.passage}</div>
              <br />
              Now, based on the <strong>passage</strong>, we would like you to
              <div className="card">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    <strong>
                      Write a statement that is{" "}
                      <span style={{ backgroundColor: "lightblue" }}>
                        {targetLabelDesc}
                      </span>
                      :
                    </strong>
                    <br />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Write a statement that is ${targetLabelDesc}?`}
                      onChange={() => {}}
                    />
                  </li>
                  <li className="list-group-item">
                    <strong>
                      Explain why you think the statement is{" "}
                      <span style={{ backgroundColor: "lightblue" }}>
                        {targetLabelDesc}
                      </span>
                      :
                    </strong>
                    <br />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Explain why you think the statement is ${targetLabelDesc}:`}
                      onChange={() => {}}
                    />
                  </li>
                  <li className="list-group-item">
                    <strong>
                      Explain why you think the AI might get it wrong:
                    </strong>
                    <br />
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Explain why you think the AI might get it wrong:`}
                      onChange={() => {}}
                    />
                  </li>
                </ul>
              </div>
              <br />
              {modelFeedBack}
              <br />
              {feedBackDesc}
              <br />
              {operationPanel}
            </div>
          </div>
        </div>
      </>
    );

    const topInstruction = (
      <>
        <h1>Write sentences and fool the AI!</h1>
      </>
    );

    let taskPreviewButton = <></>;
    if (this.state.showPreview) {
      taskPreviewButton = (
        <Button
          className="btn btn-info"
          onClick={() => {
            this.setState({ showPreview: false });
          }}
        >
          Hide Task Preview
        </Button>
      );
    } else {
      taskPreviewButton = (
        <Button
          className="btn btn-info"
          onClick={() => {
            this.setState({ showPreview: true });
          }}
        >
          Show Task Preview
        </Button>
      );
    }

    const taskPreview = this.state.showPreview ? (
      <>
        <p>
          You will be playing a <strong>game together with an AI</strong> that
          is trying to understand English and decide whether a statement is
          correct.
        </p>
        Given a <strong>passage</strong>, a <strong>statement</strong> can be
        either:
        <br />
        <ul>
          <li>Definitely correct; or</li>
          <li>Definitely incorrect; or</li>
          <li>Neither.</li>
        </ul>
        <p>
          You will be given a passage and we would like you to write a statement
          that belongs to a given category above.
          <br />
          We would also like you to explain:
          <ul>
            <li>
              Why do you think the statement is definitely correct, definitely
              incorrect, or neither?
            </li>
            <li>Why do you think the AI might get it wrong?</li>
          </ul>
        </p>
        <p>
          The AI will tell you what it thinks for each statement you write. Your
          goal is to fool the AI to get it wrong. For each passage, you will
          have multiple chances to write statements util you can fool the AI.
        </p>
        <p>
          The AI utilizes the latest technologies to understand language and can
          be very smart. Be creative to fool the AI - it will be fun!!!
        </p>
      </>
    ) : (
      <></>
    );

    const bottomInstruction = (
      <>
        <br />
        <p>
          For every successful statement, we will give your statement to other
          humans for verification. <br />
          If <strong>all</strong> of them agree{" "}
          <strong>(but the AI is fooled)</strong>, you will receive a{" "}
          <strong>bonus</strong>.<br />
          If you can keep providing good examples, your estimated total income
          will be <strong>DOUBLED</strong>.
        </p>

        <p>
          <strong style={{ color: "red" }}>Warning:</strong> Please do not spam
          the HITs, if other humans tend to disagree with your inputs, you might
          be flagged and even blocked.
        </p>

        <hr />
        <ExampleGoodCards />
      </>
    );

    return (
      <Container>
        {topInstruction}
        {taskPreviewButton}
        {taskPreview}
        <hr />
        {collectionPanel}
        {bottomInstruction}
      </Container>
    );
  }
}

export { NLIWritingInterface };
