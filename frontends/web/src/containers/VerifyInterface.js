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
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import UserContext from "./UserContext";
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import {
  OverlayProvider,
  BadgeOverlay
} from "./Overlay"

class VerifyInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {},
      example: {},
      owner_mode: false,
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
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        });
    });
  }

  getNewExample() {
    (this.state.owner_mode ? this.context.api.getRandomVerifiedFlaggedExample(this.state.taskId, this.state.task.selected_round) : this.context.api.getRandomExample(this.state.taskId, this.state.task.selected_round))
      .then((result) => {
        if (this.state.task.type !== 'extract') {
          result.target = this.state.task.targets[parseInt(result.target_pred)];
        }
        this.setState({
          example: result,
        });
      }, (error) => {
        console.log(error);
        this.setState({
          example: false
        });
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
      (this.state.owner_mode
        ? this.context.api.fullyValidateExample(this.state.example.id, action_label)
        : this.context.api.validateExample(this.state.example.id, action_label))
          .then((result) => {
            this.getNewExample();
            if (!!result.badges) {
              this.setState({showBadges: result.badges})
            }
          }, (error) => {
            console.log(error);
          });
    }
  }
  render() {
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
            <div className="mt-4 mb-5 pt-3">
              <p className="text-uppercase mb-0 spaced-header">{this.props.taskName}</p>
              <InputGroup className="align-items-center">
              <h2 className="task-page-header d-block ml-0 mt-0 text-reset">
                Validate examples
              </h2>
              </InputGroup>
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
                {this.state.example ?
                  <>
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
                            {this.state.example.metadata_json
                              ? JSON.parse(this.state.example.metadata_json).hasOwnProperty('hate_target')
                                ? <div>
                                    <h6 className="text-uppercase dark-blue-color spaced-header">
                                    Hate Target:
                                    </h6>
                                    <p>
                                    {JSON.parse(this.state.example.metadata_json).hate_target}
                                    </p>
                                  </div>
                                : ""
                              : ""
                            }
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
                      className="btn btn-light btn-sm">
                        <i className="fas fa-thumbs-up"></i> {this.state.owner_mode ? "Verified " : ""} Correct
                    </button>{" "}
                    <button
                      data-index={this.props.index}
                      onClick={() => this.handleResponse("incorrect")}
                      type="button"
                      className="btn btn-light btn-sm">
                        <i className="fas fa-thumbs-down"></i> {this.state.owner_mode ? "Verified " : ""} Incorrect
                    </button>{" "}
                    {this.state.owner_mode ?
                      ""
                      : <button
                          data-index={this.props.index}
                          onClick={() => this.handleResponse("flag")}
                          type="button"
                          className="btn btn-light btn-sm">
                            <i className="fas fa-flag"></i> Flag
                        </button>
                    }{" "}
                    <button
                      data-index={this.props.index}
                      onClick={this.getNewExample}
                      type="button"
                      className="btn btn-light btn-sm pull-right">
                        <i className="fas fa-undo-alt"></i> Skip and load new example
                    </button>
                  </Card.Footer>
                  </>
                  :
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12} md={7}>
                        <p>No more examples to be verified. Please create more examples!</p>
                      </Col>
                    </Row>
                  </Card.Body>
                }
                </Card>
                <div className="p-3">
                  {this.context.api.isTaskOwner(this.context.user, this.state.task.id) || this.context.user.admin ?
                    <OverlayTrigger
                      placement="bottom"
                      delay={{ show: 250, hide: 400 }}
                      overlay={(props) => <Tooltip id="button-tooltip" {...props}>Switch between task owner and regular annotation mode.</Tooltip>}
                    >
                      <span>
                        <BootstrapSwitchButton
                          checked={!this.state.owner_mode}
                          onlabel="Regular Mode"
                          onstyle="primary blue-bg"
                          offstyle="warning"
                          offlabel="Task Owner Mode"
                          width={180}
                          onChange={(checked) => {
                            this.setState({ owner_mode: !checked },
                            this.componentDidMount()
                          );
                          }}
                        />
                      </span>
                    </OverlayTrigger>
                   : ""
                  }
                </div>
                <div className="p-2">
                {this.state.owner_mode ?
                    <p style={{'color': 'red'}}>WARNING: You are in "Task owner mode." You can verify examples as correct or incorrect without input from anyone else!!</p>
                  : ''}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default VerifyInterface;
