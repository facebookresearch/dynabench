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
  FormControl,
  InputGroup,
  ButtonGroup,
  DropdownButton,
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Spinner,
  Modal
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import { TokenAnnotator } from "react-text-annotate";
import { PieRechart } from "../components/Rechart";
import { formatWordImportances } from "../utils/color";
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import {
  OverlayProvider,
  Annotation,
  OverlayContext,
  BadgeOverlay
} from "./Overlay"
import {
  HateSpeechDropdown
} from "./HateSpeechDropdown.js"
import "./CreateInterface.css";

const Explainer = (props) => (
  <div className="mt-4 mb-1 pt-3">
    <p className="text-uppercase mb-0 spaced-header">{props.taskName || <span>&nbsp;</span>}</p>
    <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
      Find examples that fool the model
    </h2>
  </div>
);

function ContextInfo({ taskType, taskName, text, answer, updateAnswer }) {
  return taskType == "extract" ? (
    <TokenAnnotator
      className="mb-1 p-3 light-gray-bg qa-context"
      tokens={text.split(/\b/)}
      value={answer}
      onChange={updateAnswer}
      getSpan={(span) => ({
        ...span,
        tag: "ANS",
      })}
    />
  ) : (
    <div className="mb-1 p-3 light-gray-bg">
      {taskName === "NLI" ? <h6 className="text-uppercase dark-blue-color spaced-header">Context:</h6> : ''}
      {taskName === "Sentiment" ? <h6 className="text-uppercase dark-blue-color spaced-header">Prompt:</h6> : ''}
      {text.replace("<br>", "\n")}
    </div>
  );
}

const GoalMessage = ({ targets = [], curTarget, taskType, taskShortName, onChange }) => {
  const otherTargets = targets.filter((_, index) => index !== curTarget);
  const otherTargetStr = otherTargets.join(" or ");

  const vowels = ["a", "e", "i", "o", "u"];
  const indefiniteArticle = targets[curTarget] && vowels.indexOf(targets[curTarget][0]) >= 0 ? "an" : "a";

  const successBg = "light-green-bg";
  const warningBg = "light-yellow-transparent-bg";
  const dangerBg = "light-red-transparent-bg";
  const specialBgTasks = {
    "NLI": {"entailing": successBg, "neutral": warningBg, "contradictory": dangerBg},
    "Sentiment": {"positive": successBg, "negative": dangerBg},
    "Hate Speech": {"not-hateful": successBg, "hateful": dangerBg}
  };
  const colorBg = taskShortName in specialBgTasks ? specialBgTasks[taskShortName][targets[curTarget]] : successBg;

  return (
    <div className={"mb-3"}>
      <div className={"mt-3 p-3 rounded " + colorBg}>
        {
          taskType === "extract"
            ? <InputGroup className="align-items-center">
                <i className="fas fa-flag-checkered mr-1"></i>
                <span>Your goal: enter a question and select an answer in the context, such that the model is fooled.</span>
              </InputGroup>
            : <InputGroup className="align-items-center">
                <i className="fas fa-flag-checkered mr-1"></i>
                Your goal: enter {indefiniteArticle}
                <DropdownButton variant="light" className="p-1" title={targets[curTarget] ? targets[curTarget] : "Loading.."}>
                  {targets.map((target, index) => <Dropdown.Item onClick={onChange} key={index} index={index}>{target}</Dropdown.Item>).filter((_, index) => index !== curTarget)}
                </DropdownButton>
                statement that fools the model into predicting {otherTargetStr}.
              </InputGroup>
        }
      </div>
    </div>
  );
};

const ExplainFeedback = ({explainSaved}) => {
  return (
    <span style={{float: "right"}}>
      { explainSaved === null
        ? <span style={{color: "#b58c14"}}>Draft. Click out of input box to save.</span>
        : explainSaved === false
          ? "Saving..."
          : <span style={{color: "#085756"}}>Saved!</span>
      }
    </span>
  );
};

const TextFeature = ({ data, curTarget, targets }) => {
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const { words, importances } = data;
  const target = targets[curTarget];
  if (!words || !importances) return "";
  let inspectorTitle = data.name
    ? "- " +
      data.name
        .split("_")
        .map((s) => capitalize(s))
        .join(" ")
    : "";
  const template = formatWordImportances({ words, importances }, target);
  return (
    <table className="inspectModel">
      <thead>
        <tr>
          <td>Model Inspector {`${inspectorTitle}`}</td>
        </tr>
      </thead>
      <tbody>
        <tr dangerouslySetInnerHTML={{ __html: template }}></tr>
      </tbody>
    </table>
  );
};

const TaskInstructions = (props) => {
  if (props.shortname === "QA") {
    return <QATaskInstructions />
  } else if (props.shortname === "NLI") {
    return <NLITaskInstructions />
  } else if (props.shortname === "Sentiment") {
    return <SentimentTaskInstructions />
  } else if (props.shortname === "Hate Speech") {
    return <HateSpeechTaskInstructions />
  } else {
    return (
      <p>
        Find an example that the model gets wrong but that another person would
        get right.
      </p>
    );
  }
}

const NLITaskInstructions = () => {
  return (
    <div>
      <p>
        You will be presented with a label and a passage of text. Assuming the passage is true, please write another passage that is paired with the first via the label (either 'entailment', 'neutral', or 'contradiction').
      </p>
      <p>
        Write your passage so another person will be able to guess the correct label, but the AI will be fooled!
      </p>
      <p>
        Try to come up with creative ways to beat the AI! If you notice any consistent AI failure modes, please share them in the "explanation of model failure" field!  If you'd like to explain why you're right and the model is wrong, please add that information in the "explanation of label" field!
      </p>
      <p>
        Try to ensure that:
      </p>
      <ol>
        <li>Your passage contains at least one complete sentence.</li>
        <li>Your passage cannot be related to the provided text by any label other than the provided one (remember, you can always retract mistakes!).</li>
        <li>You do not refer to the passage structure itself, such as "the third word of the passage is 'the'".</li>
        <li>You do not refer to or speculate about the author of the passage, but instead focus only on its content.</li>
        <li>Your passage doesn't require any expert external knowledge not provided.</li>
        <li>Your spelling is correct.</li>
      </ol>
    </div>
  );
};
const SentimentTaskInstructions = () => {
  return (
    <div>
      <p>
        Your objective is to come up with a statement that is either <strong>positive</strong>, <strong>neutral</strong> or
        {" "}<strong>negative</strong>, in such a way that you fool the model. Your statement should be classified
        correctly by another person!
      </p>
      <p>
        Try to come up with creative ways to fool the model. The prompt is meant as a starting point to give you inspiration.
      </p>
    </div>
  );
};
const HateSpeechTaskInstructions = () => {
  return (
    <div>
      <p>
        For the purposes of this task we define hate speech as follows:
      </p>
      <p><i>
        A direct or indirect attack on people based on characteristics, including ethnicity,
        race, nationality, immigration status, religion, caste, sex, gender identity, sexual
        orientation, and disability or disease. We define attack as violent or dehumanizing
        (comparing people to non-human things, e.g. animals) speech, statements of
        inferiority, and calls for exclusion or segregation. Mocking hate crime is also
        considered hate speech. Attacking individuals/famous people is allowed if the attack
        is not based on any of the protected characteristics listed in the definition.
        Attacking groups perpetrating hate (e.g. terrorist groups) is also not considered hate.
      </i></p>
      <p>
        <b>Note</b> that, if this wasn't already abundantly clear: this hate speech definition, and the hate speech model
        used in the loop, do not in any way reflect Facebook's (or anyone else's) policy on hate speech.
      </p>
    </div>
  );
};

const QATaskInstructions = () => {
  return (
    <div>
      <p>
        You will be presented with a <em>passage</em> of text, for which you should
        ask <em>questions</em> that the AI cannot answer correctly but that another person would
        get right. After entering the question, select the answer by <strong>highlighting the
        words that best answer the question</strong> in the passage.
      </p>
      <p>
        Try to come up with creative ways to <strong>beat the AI</strong>, and if you notice
        any consistent failure modes, please be sure to let us know in the explanation section!
      </p>
      <p>
        Try to ensure that:
      </p>
      <ol>
        <li>
          Questions must have <strong>only one valid answer</strong> in the passage
        </li>
        <li>
          The <strong>shortest span</strong> which <strong>correctly answers the question</strong> 
          is selected
        </li>
        <li>
          Questions can be correctly answered from a span in the passage and <strong>DO NOT require
          a Yes or No answer</strong>
        </li>
        <li>
          Questions can be answered from the content of the passage and <strong>DO
          NOT</strong> rely on expert external knowledge
        </li>
        <li>
          <strong>DO NOT</strong> ask questions about the passage structure such as "What is the
          third word in the passage?"
        </li>
      </ol>
    </div>
  );
};

class ResponseInfo extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.retractExample = this.retractExample.bind(this);
    this.flagExample = this.flagExample.bind(this);
    this.explainExample = this.explainExample.bind(this);
    this.updateHateSpeechTargetMetadata = this.updateHateSpeechTargetMetadata.bind(this);
    this.state = {
      loader: true,
      inspectError: false,
      livemode: this.props.livemode
    };
  }
  componentDidMount() {
    this.setState({
      loader: false,
      inspectError: false,
      explainSaved: null
    });
  }
  updateHateSpeechTargetMetadata(e) {
    const hate_type = e.target.getAttribute("data");
    const idx = e.target.getAttribute("data-index");
    this.setState({explainSaved: false, hate_type: hate_type});
    this.context.api
      .getExampleMetadata(this.props.mapKeyToExampleId[idx])
      .then((result) => {
        var metadata = JSON.parse(result);
        metadata['hate_type'] = hate_type;
        this.context.api
          .setExampleMetadata(this.props.mapKeyToExampleId[idx], metadata)
          .then((result) => {
            this.setState({explainSaved: true});
          }, (error) => {
            console.log(error);
          });
      }, (error) => {
        console.log(error);
      });
  }
  explainExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    var type = e.target.getAttribute("data-type");
    var explanation = e.target.value.trim();
    if (explanation !== "" || this.state.hasPreviousExplanation) {
      this.setState({explainSaved: false, hasPreviousExplanation: true})
      this.context.api
        .explainExample(this.props.mapKeyToExampleId[idx], type, explanation)
        .then((result) => {
          this.setState({explainSaved: true})
          if (explanation === "") {
            this.setState({hasPreviousExplanation: false})
          }
        }, (error) => {
          console.log(error);
        });
    }
  }
  retractExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api
      .retractExample(this.props.mapKeyToExampleId[idx])
      .then((result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "retracted";
        newContent[idx].retracted = true;
        this.setState({ content: newContent });
      }, (error) => {
        console.log(error);
      });
  }
  flagExample(e) {
    e.preventDefault();
    var idx = e.target.getAttribute("data-index");
    this.context.api
      .flagExample(this.props.mapKeyToExampleId[idx])
      .then((result) => {
        const newContent = this.props.content.slice();
        newContent[idx].cls = "flagged";
        newContent[idx].flagged = true;
        this.setState({ content: newContent });
      }, (error) => {
        console.log(error);
      });
  }
  inspectExample = (e) => {
    const { content, curTarget, answer } = this.props;
    e.preventDefault();
    this.setState({
      loader: true,
      inspectError: false,
    });
    var idx = e.target.getAttribute("data-index");
    let target = "None";
    if (!isNaN(parseInt(curTarget))) {
      target = curTarget;
    }
    const selectedAnswer =
      answer && answer.length ? answer[answer.length - 1].tokens.join("") : "";
    this.context.api
      .inspectModel(content[idx].url, {
        answer: selectedAnswer,
        context: content[0].text,
        hypothesis: content[idx].cls == "hypothesis" ? content[idx].text : "",
        insight: true,
        target,
      })
      .then((result) => {
        let inspectors = [];
        if (result.errorMessage) {
          this.setState({ inspectError: true });
        } else {
          const qaInspect = ["start_importances", "end_importances"];
          const isQA = qaInspect.some(
            (k) => Object.keys(result).indexOf(k) !== -1
          );
          if (isQA) {
            inspectors = qaInspect.map((imp) => {
              return {
                name: imp,
                importances: result[imp],
                words: result.words,
              };
            });
            inspectors = inspectors.filter((insp) => {
              return Array.isArray(insp["importances"]) && insp["importances"].length !== 0;
            });
            if (inspectors.length === 1) {
              inspectors[0]["name"] = "token_importances";
            }
          } else {
            inspectors = [result];
          }
        }
        const newContent = this.props.content.slice();
        newContent[idx].inspect = inspectors;
        this.setState({ content: newContent, loader: false });
      }, (error) => {
        console.log(error);
        this.setState({ inspectError: true, loader: false });
      });
  };
  render() {
    const selectedAnswer = this.props.taskType != "extract" ? "" : (
      this.props.answer && this.props.answer.length ? this.props.answer[this.props.answer.length - 1].tokens.join("") : ""
    );
    var classNames = this.props.obj.cls + " rounded border m-3";
    var userFeedback = null;
    if (this.props.obj.retracted) {
      classNames += " response-warning";
      userFeedback = <span>
        <strong>Example retracted</strong> - thanks. The model
        predicted <strong>{this.props.obj.modelPredStr}</strong>.
        Please try again!
      </span>;
    } else if (this.props.obj.flagged) {
      classNames += " response-warning";
      userFeedback = <span>
        <strong>Example flagged</strong> - thanks. The model
        predicted <strong>{this.props.obj.modelPredStr}</strong>.
      </span>;
    } else {

      if (this.props.obj.fooled) {
        classNames += " light-green-bg"
      } else {
        classNames += " response-warning"
      }

      userFeedback = <>
        <div>Model prediction: <strong>{this.props.obj.modelPredStr}</strong></div>
        {this.props.obj.fooled
          ? <span>
              <strong>Well done!</strong> You fooled the model.
            </span>
          : <span>
              <strong>Try again!</strong> The model wasn't fooled.
            </span>
        }
        {!this.state.livemode
          ? <div>
              This example was not stored because you are in sandbox mode.
              { this.context.api.loggedIn()
                ? ""
                : <div>
                    <Link
                      to={"/register?msg=" +
                          encodeURIComponent("Please sign up or log in so that you can get credit for your generated examples.") +
                          "&src=" +
                          encodeURIComponent("/tasks/" + this.props.taskId + "/create")
                          }
                    >
                      Sign up now
                    </Link>{" "}
                    to make sure your examples are stored and you get credit for your examples!
                  </div>
              }
            </div>
          : this.props.obj.fooled
            ? (
              <div className="mt-3">
                <span>
                  Optionally, provide an explanation for your example:
                </span>
                <ExplainFeedback explainSaved={this.state.explainSaved} />
                <div>
                  <input type="text" style={{width: 100+'%', marginBottom: '1px'}} placeholder={
                    "Explain why " + (this.props.taskType == "extract" ? selectedAnswer : this.props.targets[this.props.curTarget]) + " is the correct answer"}
                    data-index={this.props.index} data-type="example" onChange={() => this.setState({explainSaved: null})} onBlur={this.explainExample} />
                </div>
                <div>
                  <input type="text" style={{width: 100+'%'}}
                    placeholder="Explain why you think the model made a mistake"
                    data-index={this.props.index} data-type="model" onChange={() => this.setState({explainSaved: null})} onBlur={this.explainExample} />
                </div>
                {this.props.taskName === "Hate Speech" ?
                  <HateSpeechDropdown
                    hateType={this.state.hate_type}
                    dataIndex={this.props.index}
                    onClick={this.updateHateSpeechTargetMetadata}
                  />
                  : ""}
              </div>
            )
            : /* not fooled */
            <div className="mt-3">
              <span>
                Optionally, provide an explanation for your example:
              </span>
              <ExplainFeedback explainSaved={this.state.explainSaved} />
              <div>
                <input type="text" style={{width: 100+'%', marginBottom: '1px'}} placeholder={
                  "Explain why " + (this.props.taskType == "extract" ? selectedAnswer : this.props.targets[this.props.curTarget]) + " is the correct answer"}
                  data-index={this.props.index} data-type="example" onChange={() => this.setState({explainSaved: null})} onBlur={this.explainExample} />
              </div>
              <div>
                <input type="text" style={{width: 100+'%'}}
                  placeholder="Explain what you did to try to trick the model"
                  data-index={this.props.index} data-type="model" onChange={() => this.setState({explainSaved: null})} onBlur={this.explainExample} />
              </div>
              {this.props.taskName === "Hate Speech" ?
                <HateSpeechDropdown
                  hateType={this.state.hate_type}
                  dataIndex={this.props.index}
                  onClick={this.updateHateSpeechTargetMetadata}
                />
                : ""}
            </div>
        }
        <div className="mb-3">
          {this.state.inspectError ? (
            <span style={{ color: "#e65959" }}>
              *Unable to fetch results. Please try again after sometime.
            </span>
          ) : null}
          {this.props.obj.inspect &&
            this.props.obj.inspect.map((inspectData, idx) => {
              return (<>
                <TextFeature
                  key={idx}
                  data={inspectData}
                  curTarget={this.props.curTarget}
                  targets={this.props.targets}
                />
                <div className="mt-3">
                  <span>
                    The model inspector shows the <a href="https://captum.ai/docs/extension/integrated_gradients" target="_blank">layer integrated gradients</a> for the input token layer of the model.
                  </span>
                </div>
              </>);
            })}
        </div>
      </>;
    }
    return (
      <Card
        className={classNames}
        style={{ minHeight: 120 }}
      >
        <Card.Body className="p-3">
          <Row>
            <Col xs={12} md={7}>
              <div className="mb-3">{this.props.obj.text}</div>
              <small>
                {userFeedback}
              </small>
            </Col>
            <Col xs={12} md={5}>
              <PieRechart
                data={this.props.obj.response.prob}
                labels={this.props.targets}
              />
            </Col>
          </Row>
        </Card.Body>
        {this.props.obj.retracted || this.props.obj.flagged || !this.state.livemode
          ? null
          : <Card.Footer>
            { <div className="btn-group" role="group" aria-label="response actions">
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={(props) => <Tooltip {...props}>If you made a mistake, you can retract this entry from the dataset.</Tooltip>}
                >
                  <button
                    data-index={this.props.index}
                    onClick={this.retractExample}
                    type="button"
                    className="btn btn-light btn-sm">
                      <i className="fas fa-undo-alt"></i> Retract
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={(props) => <Tooltip {...props}>Something wrong? Flag this example and we will take a look.</Tooltip>}
                >
                  <button
                    data-index={this.props.index}
                    onClick={this.flagExample}
                    type="button"
                    className="btn btn-light btn-sm">
                      <i className="fas fa-flag"></i> Flag
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 250, hide: 400 }}
                  overlay={(props) => <Tooltip {...props}>Want more insight into how this decision was made?</Tooltip>}
                >
                  <button
                    data-index={this.props.index}
                    onClick={this.inspectExample}
                    type="button"
                    className="btn btn-light btn-sm">
                      <i className="fas fa-search"></i> Inspect
                      {this.state.loader ? (<>
                        {" "}<span>(this may take a while)</span><Spinner className="ml-2" animation="border" role="status" size="sm">
                          <span className="sr-only">Loading...</span>
                        </Spinner>
                      </>) : null}
                  </button>
                </OverlayTrigger>
              </div>
            }
        </Card.Footer>}
      </Card>
    );
  }
}

class CreateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      answer: [],
      taskId: null,
      task: {},
      context: null,
      target: 0,
      modelPredIdx: null,
      modelPredStr: "",
      hypothesis: "",
      content: [],
      retainInput: false,
      livemode: true,
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleGoalMessageTargetChange = this.handleGoalMessageTargetChange.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.switchLiveMode = this.switchLiveMode.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
    this.updateRetainInput = this.updateRetainInput.bind(this);
    this.updateSelectedRound = this.updateSelectedRound.bind(this);
    this.chatContainerRef = React.createRef();
    this.bottomAnchorRef = React.createRef();

  }
  getNewContext() {
    this.setState(
      { answer: [], submitDisabled: true, refreshDisabled: true },
      () => {
        this.context.api
          .getRandomContext(this.state.taskId, this.state.task.selected_round)
          .then((result) => {
            var randomTarget = Math.floor(
              Math.random() * this.state.task.targets.length
            );
            const randomModel = this.pickModel(this.state.task.round.url);
            this.setState({
              hypothesis: "",
              target: randomTarget,
              randomModel: randomModel,
              context: result,
              content: [{ cls: "context", text: result.context }],
              submitDisabled: false,
              refreshDisabled: false,
            });
          }, (error) => {
            console.log(error);
          });
      }
    );
  }

  updateRetainInput(e) {
    const retainInput = e.target.checked;
    if (this.context.api.loggedIn()) {
      var settings_json;
      if (this.context.user.settings_json) {
        settings_json = JSON.parse(this.context.user.settings_json);
        settings_json['retain_input'] = retainInput;
      } else {
        settings_json = {'retain_input': retainInput};
      }
      this.context.user.settings_json = JSON.stringify(settings_json);
      this.context.api.updateUser(this.context.user.id, this.context.user);
    }
    this.setState({ retainInput: retainInput });
  }

  updateSelectedRound(e) {
    const selected = parseInt(e.target.getAttribute('index'));
    if (selected != this.state.task.selected_round) {
      this.context.api.getTaskRound(this.state.task.id, selected)
        .then((result) => {
          var task = {...this.state.task};
          task.round = result;
          task.selected_round = selected;
          this.setState({ task: task }, function() {
            this.getNewContext();
          });
        }, (error) => {
          console.log(error);
        });
    }
  }

  pickModel = (modelUrls) => {
    const models = modelUrls.split("|");
    const model = models[Math.floor(Math.random() * models.length)];
    return model;
  };

  instantlyScrollToBottom() {
    setTimeout(() => {
      if (this.chatContainerRef.current)
        this.chatContainerRef.current.scrollTop =
          this.chatContainerRef.current.scrollHeight;
    }, 0);
  }

  smoothlyAnimateToBottom() {
    if (this.bottomAnchorRef.current) {
      this.bottomAnchorRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  handleGoalMessageTargetChange(e) {
    this.setState({
      target: parseInt(e.target.getAttribute('index')),
      content: [this.state.content[0]]
    });
  }
  handleResponse(e) {
    e.preventDefault();
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      if (this.state.hypothesis.length == 0) {
        this.setState({ submitDisabled: false, refreshDisabled: false });
        return;
      }
      if (this.state.task.type == "extract" && this.state.answer.length == 0) {
        this.setState({
          submitDisabled: false,
          refreshDisabled: false,
          answerNotSelected: true,
        });
        return;
      }

      if (this.state.task.type == "extract") {
        var answer_text = "";
        if (this.state.answer.length > 0) {
          var last_answer = this.state.answer[this.state.answer.length - 1];
          var answer_text = last_answer.tokens.join(""); // NOTE: no spaces required as tokenising by word boundaries
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

      this.context.api
        .getModelResponse(this.state.randomModel, modelInputs)
        .then((result) => {
          if (result.errorMessage) {
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

            if (this.state.task.type == "extract") {
              var modelPredIdx = null;
              var modelPredStr = result.text;
              var modelFooled = !result.model_is_correct;
              // TODO: handle this more elegantly
              result.prob = [result.prob, 1 - result.prob];
              this.state.task.targets = ["confidence", "uncertainty"];
            } else {
              var modelPredIdx = result.prob.indexOf(Math.max(...result.prob));
              var modelPredStr = this.state.task.targets[modelPredIdx];
              var modelFooled =
                result.prob.indexOf(Math.max(...result.prob)) !==
                this.state.target;
            }

            this.setState({
              content: [
                ...this.state.content,
                {
                  cls: "hypothesis",
                  modelPredIdx: modelPredIdx,
                  modelPredStr: modelPredStr,
                  fooled: modelFooled,
                  text: this.state.hypothesis,
                  url: this.state.randomModel,
                  retracted: false,
                  response: result,
                },
              ],
            },
            function () {
              this.smoothlyAnimateToBottom();
              if (!this.state.livemode) {
                // We are in sandbox
                this.setState({
                  hypothesis: this.state.retainInput? this.state.hypothesis : "",
                  submitDisabled: false,
                  refreshDisabled: false,
                });
                return;
              }
              const metadata = {'model': this.state.randomModel}
              this.context.api
                .storeExample(
                  this.state.task.id,
                  this.state.task.selected_round,
                  this.context.user.id,
                  this.state.context.id,
                  this.state.hypothesis,
                  this.state.target,
                  result,
                  metadata
                )
                .then((result) => {
                  var key = this.state.content.length - 1;
                  this.setState({
                    hypothesis: this.state.retainInput? this.state.hypothesis : "",
                    submitDisabled: false,
                    refreshDisabled: false,
                    mapKeyToExampleId: {
                      ...this.state.mapKeyToExampleId,
                      [key]: result.id,
                    },
                  });

                  if (!!result.badges) {
                    this.setState({showBadges: result.badges})
                  }

                }, (error) => {
                  console.log(error);
                  this.setState({
                    submitDisabled: false,
                    refreshDisabled: false,
                  });
                });
              });
          }
        }, (error) => {
          console.log(error);
          this.setState({
            submitDisabled: false,
            refreshDisabled: false,
          });
        });
    });
  }
  handleResponseChange(e) {
    this.setState({ hypothesis: e.target.value });
  }
  switchLiveMode(checked) {
    if (checked === true && !this.context.api.loggedIn()) {
      this.props.history.push(
        "/register?msg=" +
          encodeURIComponent(
            "Please sign up or log in so that you can get credit for your generated examples."
          ) +
          "&src=" +
          encodeURIComponent("/tasks/" + this.props.taskId + "/create")
      );
    }
    this.setState({ livemode: checked });
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.setState({ livemode: false });
    }

    const user = this.context.api.getCredentials();
    this.context.api
      .getUser(user.id, true)
      .then((result) => {
        if (result.settings_json) {
          var settings_json = JSON.parse(result.settings_json);
          if (settings_json['retain_input']) {
            this.setState({ retainInput: settings_json['retain_input'] });
          }
        }
      }, (error) => {
        console.log(error);
      });

    this.setState({ taskId: params.taskId }, function () {
      this.context.api
        .getTask(this.state.taskId)
        .then((result) => {
          result.targets = result.targets.split("|"); // split targets
          this.setState({ task: result }, function () {
            this.state.task.selected_round = this.state.task.cur_round;
            this.getNewContext();
          });
        }, (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        });
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
  render() {
    const contextContent = this.state.content
      .filter(item => item.cls === "context")
      .map((item, index) => (
        <Annotation
          key={index}
          placement="bottom-start"
          tooltip={"This is the context that applies to your particular example. It will be passed to the model alongside your generated text if the model expects a context."}>
          <ContextInfo
            index={index}
            text={item.text}
            targets={this.state.task.targets}
            curTarget={this.state.target}
            taskType={this.state.task.type}
            taskName={this.state.task.shortname}
            answer={this.state.answer}
            updateAnswer={this.updateAnswer}
          />
        </Annotation>
      ));
    const content = this.state.content.map((item, index) =>
      item.cls === "context" ? undefined : (
        <ResponseInfo
          randomModel={this.state.randomModel}
          key={index}
          index={index}
          targets={this.state.task.targets}
          curTarget={this.state.target}
          taskType={this.state.task.type}
          taskName={this.state.task.shortname}
          answer={this.state.answer}
          livemode={this.state.livemode}
          obj={item}
          mapKeyToExampleId={this.state.mapKeyToExampleId}
          content={this.state.content}
        />
      )
    ).filter(item => item !== undefined);
    // sentinel value of undefined filtered out after to preserve index values
    const rounds = (this.state.task.round && this.state.task.cur_round) || 0;
    const roundNavs = [];
    for (let i = rounds; i > 0; i--) {
      let cur = '';
      let active = false;
      if (i == this.state.task.cur_round) {
        cur = ' (active)';
      }
      if (i == this.state.task.selected_round) {
        active = true;
      }
      roundNavs.push(
        <Dropdown.Item key={i} index={i} onClick={this.updateSelectedRound} active={active}>Round {i}{cur}</Dropdown.Item>
      );
      if (i == this.state.task.cur_round) {
        roundNavs.push(
          <Dropdown.Divider key={'div'+i} />
        );
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
      return renderTooltip(props, "Switch to other rounds of this task, including no longer active ones.");
    }
    function renderSwitchContextTooltip(props) {
      return renderTooltip(props, "Don't like this context? Try another one.");
    }

    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({showBadges: ""})}
        >
        </BadgeOverlay>
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={12}>
          <div style={{float: "right"}}>
            <ButtonGroup>
              <Annotation placement="left" tooltip="Click to show help overlay">
                <OverlayContext.Consumer>
                  {
                    ({hidden, setHidden})=> (
                        <button type="button" className="btn btn-outline-primary btn-sm btn-help-info"
                          onClick={() => { setHidden(!hidden) }}
                        ><i className="fas fa-question"></i></button>
                    )
                  }
                </OverlayContext.Consumer>
              </Annotation>
              <Annotation placement="bottom" tooltip="Click to learn more details about this task challenge">
                <button type="button" className="btn btn-outline-primary btn-sm btn-help-info"
                  onClick={() => { this.setState({showInfoModal: true}) }}
                ><i className="fas fa-info"></i></button>
              </Annotation>
              <Annotation placement="top" tooltip="Click to adjust your create settings">
                <button type="button" className="btn btn-outline-primary btn-sm btn-help-info"
                  onClick={() => { this.setState({showCreateSettingsModal: true}) }}
                ><i className="fa fa-cog"></i></button>
              </Annotation>
            </ButtonGroup>
            <Modal
              show={this.state.showInfoModal}
              onHide={() => this.setState({showInfoModal: false})}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Instructions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <TaskInstructions shortname={this.state.task.shortname} />
                </Modal.Body>
            </Modal>
            <Modal
              show={this.state.showCreateSettingsModal}
              onHide={() => this.setState({showCreateSettingsModal: false})}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Create Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Check checked={this.state.retainInput} label="Do you want to retain your input for the same context?" onChange={this.updateRetainInput}/>
                </Modal.Body>
            </Modal>
          </div>
          <Explainer taskName={this.state.task.name} />
          <Annotation
            placement="top"
            tooltip={"This is your goal. Dynabench specifies what the true label should be of your model-fooling example. You can change this label by clicking it."}>
            <GoalMessage
              targets={this.state.task.targets}
              curTarget={this.state.target}
              taskType={this.state.task.type}
              taskShortName={this.state.task.shortname}
              onChange={this.handleGoalMessageTargetChange}
            />
          </Annotation>
          <Card className="profile-card overflow-hidden">
            {contextContent}
            <Card.Body className="overflow-auto pt-2" style={{ height: 385 }} ref={this.chatContainerRef}>
              {content}
              <div
                className="bottom-anchor"
                ref={this.bottomAnchorRef}
              />
            </Card.Body>
            <Form>
              <Annotation placement="top" tooltip="Enter your example here">
              <InputGroup>
                  <FormControl
                    className="m-3 p-3 rounded-1 thick-border h-auto light-gray-bg"
                    placeholder={
                      ["NLI", "QA", "Sentiment", "Hate Speech"].includes(this.state.task.shortname)
                      ? {
                          "NLI": "Enter " + this.state.task.targets[this.state.target] + " hypothesis..",
                          "QA": "Enter question..",
                          "Sentiment": "Enter " + this.state.task.targets[this.state.target] + " statement..",
                          "Hate Speech": "Enter " + this.state.task.targets[this.state.target] + " statement..",
                        }[this.state.task.shortname]
                      : 'Enter statement..'
                    }
                    value={this.state.hypothesis}
                    onChange={this.handleResponseChange}
                    required={true}
                  />
              </InputGroup>
              </Annotation>

              <Row className="p-3">
                <Col xs={6}>
                  <InputGroup>
                    <OverlayTrigger
                      placement="bottom"
                      delay={{ show: 250, hide: 400 }}
                      overlay={renderSandboxTooltip}
                    >
                      <span style={{marginRight: 10}}>
                        <Annotation placement="left" tooltip="If you want to just play around without storing your examples, you can switch to Sandbox mode here.">
                          <BootstrapSwitchButton
                            checked={this.state.livemode}
                            onlabel='Live Mode'
                            onstyle='primary blue-bg'
                            offstyle='warning'
                            offlabel='Sandbox'
                            width={120}
                            onChange={(checked) => {
                              this.switchLiveMode(checked);
                            }}
                          />
                        </Annotation>
                      </span>
                    </OverlayTrigger>

                    {this.state.task.cur_round > 1 ?
                    <OverlayTrigger
                      placement="bottom"
                      delay={{ show: 250, hide: 400 }}
                      overlay={renderSwitchRoundTooltip}
                    >
                      <Annotation placement="right" tooltip="Want to try talking to previous rounds? You can switch here.">
                        <DropdownButton
                          variant="light"
                          className="border-0 blue-color font-weight-bold light-gray-bg"
                          style={{marginRight: 10}}
                          id="dropdown-basic-button"
                          title={"Round " + this.state.task.selected_round + (this.state.task.selected_round === this.state.task.cur_round ? " (active)" : "")}
                        >
                          {roundNavs}
                        </DropdownButton>
                      </Annotation>
                    </OverlayTrigger>
                      : null}
                  </InputGroup>
                </Col>
                <Col xs={6}>
                  <InputGroup className="d-flex justify-content-end">
                  <OverlayTrigger
                    placement="bottom"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderSwitchContextTooltip}
                  >
                    <Annotation placement="left" tooltip="Don’t like this context, or this goal label? Try another one.">
                      <Button
                        className="font-weight-bold blue-color light-gray-bg border-0 task-action-btn"
                        onClick={this.getNewContext}
                        disabled={this.state.refreshDisabled}
                      >
                        Switch to next context
                      </Button>
                    </Annotation>
                  </OverlayTrigger>
                  <Annotation placement="top" tooltip="When you’re done, you can submit the example and we’ll find out what the model thinks!">
                    <Button
                      type="submit"
                      className="font-weight-bold blue-bg border-0 task-action-btn"
                      onClick={this.handleResponse}
                      disabled={this.state.submitDisabled}
                    >
                      Submit{" "}
                      <i
                        className={
                          this.state.submitDisabled ? "fa fa-cog fa-spin" : ""
                        }
                      />
                    </Button>
                  </Annotation>
                </InputGroup>
              </Col>
            </Row>
            </Form>
            <div className="p-2">
              {(this.state.task.cur_round !== this.state.task.selected_round) ?
                <p style={{'color': 'red'}}>WARNING: You are talking to an outdated model for a round that is no longer active. Examples you generate may be less useful.</p>
              : ''}
              {!this.state.livemode ?
                <p style={{'color': 'red'}}>WARNING: You are in "just playing" sandbox mode. Your examples are not saved!!</p>
              : ''}

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
