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
  InputGroup,
  Button,
  FormControl,
} from "react-bootstrap";

import { TokenAnnotator, TextAnnotator } from "react-text-annotate";

import "./ValidateInterface.css";

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
        />
      </>
    );
  }
}

class ValidateInterface extends React.Component {
  constructor(props) {
    super(props);
    this.api = props.api;
    this.state = {
      taskId: null,
      task: {},
      example: {},
      comment: {},
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.setComment = this.setComment.bind(this);
  }
  componentDidMount() {
    this.setState({ taskId: this.props.taskConfig.task_id }, function () {
      this.api.getTask(this.state.taskId).then(
        (result) => {
          result.targets = result.targets.split("|"); // split targets
          this.setState({ task: result }, function () {
            this.state.task.selected_round = this.state.task.cur_round;
            this.getNewExample();
          });
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }
  setComment(e) {
    this.setState({ comment: e.target.value });
  }
  getNewExample() {
    this.api
      .getRandomExample(
        this.state.taskId, 
        this.state.task.cur_round,
        this.getTagList(this.props),
        [],
        this.props.providerWorkerId
      )
      .then(
        (result) => {
          if (this.state.task.type !== "extract") {
            result.target = this.state.task.targets[
              parseInt(result.target_pred)
            ];
          }
          this.setState({
            example: result,
          });
        },
        (error) => {
          console.log(error);
          this.setState({
            example: false,
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
  handleResponse(action) {
    var action_label = null;
    switch (action) {
      case "correct":
        action_label = "C";
        break;
      case "incorrect":
        action_label = "I";
        break;
      case "flag":
        action_label = "F";
        break;
    }
    if (action_label !== null) {
      this.setState({ label: action_label });
      var metadata = { annotator_id: this.props.providerWorkerId };
      this.api
        .validateExample(this.state.example.id, action, "user", metadata)
        .then(
          (result) => {
            this.props.onSubmit(this.state);
          },
          (error) => {
            console.log(error);
          }
        );
    }
  }
  render() {
    var content;
    if (this.state.example.context) {
      var example_metadata = JSON.parse(this.state.example.metadata_json);
      var exampleHistory = JSON.parse(example_metadata.exampleHistory);

      // Get last answer
      var ans_start = null;
      var ans_end = null;
      for (var i = exampleHistory.length - 1; i >= 0; i--) {
        let item = exampleHistory[i];
        if ("activityType" in item && item["activityType"] == "Answer changed") {
          var ans_start = item.answer[0].start;
          var ans_end = item.answer[0].end;
          break;
        } else if ("activityType" in item && item["activityType"] == "Generated a QA pair") {
          var ans_char_start = item.questionMetadata.metadata_gen.answer_start;
          var ans_char_end = item.questionMetadata.metadata_gen.answer_end;
          var tokens = this.state.example.context.context.split(/\b|(?<=[\s\(\)])|(?=[\s\(\)])/);
          var char_to_token_map = [];
          for (let token_id = 0; token_id < tokens.length; token_id++) {
            for (var char_id = 0; char_id < tokens[token_id].length; char_id++) {
              char_to_token_map.push(token_id);
            }
          }
          var ans_start = char_to_token_map[ans_char_start];
          var ans_end = char_to_token_map[ans_char_end];
          break;
        }
      }

      var answer = [{ start: ans_start, end: ans_end, tag: "ANS" }];
      content = (
        <ContextInfo
          answer={answer}
          text={this.state.example.context.context}
        />
      );
    }
    return (
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={12}>
          <Card className="profile-card overflow-hidden">
            <div className="mb-1 p-3 light-gray-bg">
              <h6 className="text-uppercase dark-blue-color spaced-header">
                Context:
              </h6>
              <Card.Body>
                {this.state.example.context && content}
              </Card.Body>
            </div>
            <Card.Body className="overflow-auto pt-2">
              <Card>
                {this.state.example ? (
                  <>
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12}>
                          <div className="mb-3">
                            <h6 className="text-uppercase dark-blue-color spaced-header">
                              Question:
                            </h6>
                            <p>{this.state.example.text}</p>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer>
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("correct")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-thumbs-up"></i> Correct
                      </button>{" "}
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("incorrect")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-thumbs-down"></i> Incorrect
                      </button>{" "}
                      <button
                        data-index={this.props.index}
                        onClick={() => this.handleResponse("flag")}
                        type="button"
                        className="btn btn-light btn-sm"
                      >
                        <i className="fas fa-flag"></i> Flag
                      </button>{" "}
                    </Card.Footer>
                  </>
                ) : (
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12}>
                        <p>No more examples to be verified!</p>
                      </Col>
                    </Row>
                  </Card.Body>
                )}
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export { ValidateInterface };
