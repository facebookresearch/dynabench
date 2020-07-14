import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  FormControl,
  InputGroup,
} from "react-bootstrap";
import UserContext from "./UserContext";
import { TokenAnnotator } from "react-text-annotate";
import { PieRechart } from "../components/Rechart";

const Explainer = (props) => (
  <div className="mt-4 mb-5 pt-3">
    <p className="text-uppercase font-weight-bold">{props.taskName}</p>
    <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
      Find examples that fool the model
    </h2>
    <p>
      Find an example that the model gets wrong but that another person would
      get right.
    </p>
  </div>
);

class ContextInfo extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return this.props.taskType == "extract" ? (
      <>
        <TokenAnnotator
          className="mb-1 p-3 light-gray-bg"
          tokens={this.props.text.split(/\b/)}
          value={this.props.answer}
          onChange={this.props.updateAnswer}
          getSpan={(span) => ({
            ...span,
            tag: "ANS",
          })}
        />
        <p className="mt-3 px-3">
          Your goal: enter a question and select an answer in the context, such
          that the model is fooled.
        </p>
      </>
    ) : (
      <>
        <div className="mb-1 p-3 light-gray-bg">{this.props.text}</div>
        <p className="mt-3 px-3">
          Your goal: enter a{" "}
          <strong>{this.props.targets[this.props.curTarget]}</strong> statement
          that fools the model.
        </p>
      </>
    );
  }
}

class ResponseInfo extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.retractExample = this.retractExample.bind(this);
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
      })
      .catch((error) => {
        console.log(error);
      });
  }
  render() {
    return (
      <div
        className={
          this.props.obj.cls +
          " rounded border " +
          (this.props.obj.retracted
            ? "border-warning"
            : this.props.obj.fooled
            ? "border-success"
            : "border-danger")
        }
        style={{ minHeight: 120 }}
      >
        <Row>
          <Col xs={12} md={8}>
            <div>{this.props.obj.text}</div>
            <small>
              {this.props.obj.retracted ? (
                <>
                  <span>
                    <strong>Example retracted</strong> - thanks. The model
                    predicted <strong>{this.props.obj.modelPredStr}</strong>.
                    Please try again!
                  </span>
                </>
              ) : this.props.obj.fooled ? (
                <>
                  <span>
                    <strong>Well done!</strong> You fooled the model. The model
                    predicted <strong>{this.props.obj.modelPredStr}</strong>{" "}
                    instead.{" "}
                  </span>
                  <br />
                  <span>
                    Made a mistake? You can still{" "}
                    <a
                      href="#"
                      data-index={this.props.index}
                      onClick={this.retractExample}
                      className="btn-link"
                    >
                      retract this example
                    </a>
                    . Otherwise, we will have it verified.
                  </span>
                </>
              ) : (
                <>
                  <span>
                    <strong>Bad luck!</strong> The model correctly predicted{" "}
                    <strong>{this.props.obj.modelPredStr}</strong>. Try again.
                  </span>
                  <span>
                    We will still store this as an example that the model got
                    right. You can{" "}
                    <a
                      href="#"
                      data-index={this.props.index}
                      onClick={this.retractExample}
                      className="btn-link"
                    >
                      retract this example
                    </a>{" "}
                    if you don't want it saved.
                  </span>
                </>
              )}
            </small>
          </Col>
          <Col xs={12} md={4}>
            <PieRechart
              data={this.props.obj.response.prob}
              labels={this.props.targets}
            />
          </Col>
        </Row>
      </div>
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
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.handleResponseChange = this.handleResponseChange.bind(this);
    this.updateAnswer = this.updateAnswer.bind(this);
  }
  getNewContext() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.context.api
        .getRandomContext(this.state.taskId, this.state.task.cur_round)
        .then((result) => {
          var randomTarget = Math.floor(
            Math.random() * this.state.task.targets.length
          );
          this.setState({
            hypothesis: "",
            target: randomTarget,
            context: result,
            content: [{ cls: "context", text: result.context }],
            submitDisabled: false,
            refreshDisabled: false,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  pickModel = (modelUrls) => {
    const models = modelUrls.split("|");
    const model = models[Math.floor(Math.random() * models.length)];
    return model;
  };

  handleResponse() {
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
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
          var answer_text = last_answer.tokens.join("");  // NOTE: no spaces required as tokenising by word boundaries
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
      };

      const randomModel = this.pickModel(this.state.task.round.url);
      this.context.api
        .getModelResponse(randomModel, modelInputs)
        .then((result) => {
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
              this.context.api
                .storeExample(
                  this.state.task.id,
                  this.state.task.cur_round,
                  this.context.user.id,
                  this.state.context.id,
                  this.state.hypothesis,
                  this.state.target,
                  result,
                  randomModel
                )
                .then((result) => {
                  var key = this.state.content.length - 1;
                  this.setState({
                    hypothesis: "",
                    submitDisabled: false,
                    refreshDisabled: false,
                    mapKeyToExampleId: {
                      ...this.state.mapKeyToExampleId,
                      [key]: result.id,
                    },
                  });
                })
                .catch((error) => {
                  console.log(error);
                  this.setState({
                    submitDisabled: false,
                    refreshDisabled: false,
                  });
                });
            }
          );
        })
        .catch((error) => {
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
          encodeURIComponent("/tasks/" + params.taskId + "/create")
      );
    }

    this.setState({ taskId: params.taskId }, function () {
      this.context.api
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
    });
  }
  updateAnswer(value) {
    // Only keep the last answer annotated
    if (value.length > 0) {
      this.setState({ answer: [value[value.length - 1]] });
    } else {
      this.setState({ answer: value });
    }
  }
  render() {
    const content = this.state.content.map((item, index) =>
      item.cls == "context" ? (
        <ContextInfo
          key={index}
          index={index}
          text={item.text}
          targets={this.state.task.targets}
          curTarget={this.state.target}
          taskType={this.state.task.type}
          answer={this.state.answer}
          updateAnswer={this.updateAnswer}
        />
      ) : (
        <ResponseInfo
          key={index}
          index={index}
          targets={this.state.task.targets}
          obj={item}
          mapKeyToExampleId={this.state.mapKeyToExampleId}
          content={this.state.content}
        />
      )
    );

    return (
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={9}>
          <Explainer taskName={this.state.task.name} />
          <Card className="profile-card overflow-hidden">
            <Card.Body className="overflow-auto" style={{ height: 400 }}>
              {content}
            </Card.Body>
            <InputGroup>
              <FormControl
                className="border-left-0 border-right-0 rounded-0 p-3 h-auto"
                placeholder={
                  this.state.task.type == "extract"
                    ? "Enter question.."
                    : "Enter hypothesis.."
                }
                value={this.state.hypothesis}
                onChange={this.handleResponseChange}
              />
            </InputGroup>
            <InputGroup className="d-flex justify-content-end p-3">
              <Button
                className="font-weight-bold blue-color light-gray-bg border-0 task-action-btn"
                onClick={this.getNewContext}
                disabled={this.state.refreshDisabled}
              >
                Switch to next context
              </Button>
              <Button
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
            </InputGroup>
          </Card>
        </Col>
      </Container>
    );
  }
}

export default CreateInterface;
