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
  Button
} from "react-bootstrap";
import UserContext from "./UserContext";

class VerifyInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {},
      example: {},
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
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
            this.state.task.selected_round = this.state.task.cur_round;
            this.getNewExample();
          });
        }, (error) => {
          console.log(error);
        });
    });
  }
  getNewExample() {
    this.context.api
      .getRandomExample(this.state.taskId, this.state.task.selected_round)
      .then((result) => {
        if (this.state.task.type !== 'extract') {
          result.target = this.state.task.targets[parseInt(result.target_pred)];
        }
        this.setState({
          example: result,
        });
      }, (error) => {
        console.log(error);
      });
  }
  handleResponse(action) {
    var action_label = null;
    switch(action) {
      case 'correct':
        action_label = 'C';
        break;
      case 'incorrect':
        action_label = 'I';
        break;
      case 'flag':
        action_label = 'F';
        break;
    }
    if (action_label !== null) {
      this.context.api
        .validateExample(this.state.example.id, action_label)
        .then((result) => {
          this.getNewExample();
        }, (error) => {
          console.log(error);
        });
    }
  }
  render() {
    console.log(this.state);
    return (
      <Container className="mb-5 pb-5">
        <Col className="m-auto" lg={12}>
          <div className="mt-4 mb-5 pt-3">
            <p className="text-uppercase mb-0 spaced-header">{this.props.taskName}</p>
            <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
              Validate examples
            </h2>
            <p>
              If a model was fooled, we need to make sure that the example is correct.
            </p>
          </div>
          {this.state.task.shortname === "Hate Speech" ?
            <p className="mt-3 p-3 light-red-bg rounded white-color"><strong>WARNING</strong>: This is sensitive content! If you do not want to see any hateful examples, please switch to another task.</p>
            : null
          }
          <Card className="profile-card overflow-hidden">
            <div className="mb-1 p-3 light-gray-bg">
              <h6 className="text-uppercase dark-blue-color spaced-header">Context:</h6>
              {this.state.example.context && this.state.example.context.context.replace("<br>", "\n")}
            </div>
            <Card.Body className="overflow-auto pt-2" style={{ height: 400 }}>
              <Card
                className="hypothesis rounded border m-3 card"
                style={{ minHeight: 120 }}
              >
                <Card.Body className="p-3">
                  <Row>
                    <Col xs={12} md={7}>
                      {this.state.task.type == "extract" ?
                        <div className="mb-3">
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                          Question:
                          </h6>
                          <p>
                          {this.state.example.text}
                          </p>
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                          Answer:
                          </h6>
                          <p>
                          {this.state.example.target_pred}
                          </p>
                        </div>
                        :
                        <div className="mb-3">
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                          {this.state.task.shortname === "NLI" ? "Hypothesis" : "Statement"}:
                          </h6>
                          <p>
                          {this.state.example.text}
                          </p>
                          <h6 className="text-uppercase dark-blue-color spaced-header">
                          Label:
                          </h6>
                          <p>
                          {this.state.example.target}
                          </p>
                        </div>
                      }
                    </Col>
                  </Row>
                </Card.Body>
                <Card.Footer>
                  <button
                    data-index={this.props.index}
                    onClick={() => this.handleResponse("correct")}
                    type="button"
                    class="btn btn-light btn-sm">
                      <i className="fas fa-thumbs-up"></i> Correct
                  </button>{" "}
                  <button
                    data-index={this.props.index}
                    onClick={() => this.handleResponse("incorrect")}
                    type="button"
                    class="btn btn-light btn-sm">
                      <i className="fas fa-thumbs-down"></i> Incorrect
                  </button>{" "}
                  <button
                    data-index={this.props.index}
                    onClick={() => this.handleResponse("flag")}
                    type="button"
                    class="btn btn-light btn-sm">
                      <i className="fas fa-flag"></i> Flag
                  </button>{" "}
                  <button
                    data-index={this.props.index}
                    onClick={this.getNewExample}
                    type="button"
                    class="btn btn-light btn-sm pull-right">
                      <i className="fas fa-undo-alt"></i> Skip and load new example
                  </button>
                </Card.Footer>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export default VerifyInterface;
