/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./TaskPage.css";
import { Container, Row, Col, ButtonGroup, Nav } from "react-bootstrap";
import UserContext from "./UserContext";
import Moment from "react-moment";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import FloresActionButtons from "../components/Buttons/FloresActionButtons";
import ModelLeaderBoard from "../components/FloresComponents/ModelLeaderboard";
import FloresTaskDescription from "../components/FloresComponents/FloresTaskDescription";

const TaskNav = ({ location }) => {
  const currentHash = location.hash;

  return (
    <Nav className="flex-lg-column sidebar-wrapper sticky-top">
      <Nav.Item>
        <Nav.Link
          href={`#${16}`}
          className={`${
            currentHash === `#${16}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Large Track
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          href={`#${14}`}
          className={`${
            currentHash === `#${14}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Small Track 1
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          href={`#${15}`}
          className={`${
            currentHash === `#${15}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Small Track 2
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

class FloresTaskPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: props.location.hash === "" ? "16" : props.location.hash.slice(1),
      task: {},
      modelLeaderBoardPage: 0,
      isEndOfModelLeaderPage: true,
      pageLimit: 5,
    };
  }

  componentDidMount() {
    if (!this.props.location.hash || this.props.location.hash === "") {
      this.setState({ taskId: "16" });
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.setState({
        taskId: this.props.location.hash.slice(1),
      });
    }
  }

  getFloresTaskTitle = () => {
    const taskId = this.props.location.hash;
    switch (taskId) {
      case "#16":
        return "Large Track";
      case "#14":
        return "Small Track 1";
      case "#15":
        return "Small Track 2";
      default:
        return "Large Track";
    }
  };

  render() {
    return (
      <OverlayProvider initiallyHide={true} delayMs="1700">
        <Container fluid>
          <Row>
            <Col lg={2} className="p-0 border">
              <Annotation
                placement="bottom-start"
                tooltip="FloRes tasks happen over multiple tracks. You can look at other FloRes tracks here"
              >
                <TaskNav {...this.props} taskDetail={this.state.task} />
              </Annotation>
            </Col>
            <Col lg={10} className="px-4 px-lg-5">
              <h2 className="task-page-header text-reset ml-0">FloRes</h2>
              <div style={{ float: "right", marginTop: 30 }}>
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
                </ButtonGroup>
              </div>
              <p>
                {" "}
                FLoRes is a benchmark dataset for machine translation between
                English and low-resource languages.{" "}
              </p>
              <hr />
              <FloresTaskDescription taskId={this.state.taskId} />
              <FloresActionButtons
                api={this.context.api}
                taskId={this.state.taskId}
                user={this.context.user}
              />
              <p>
                The training data is provided by the publicly available Opus
                repository, which contains data of various quality from a
                variety of domains. We also provide in-domain Wikipedia
                monolingual data for each language. nn All tracks will be fully
                constrained, so only the data that is provided can be used. This
                will enable fairer comparison across methods. Check the{" "}
                <a href="http://data.statmt.org/wmt21/multilingual-task/">
                  multilingual data page
                </a>{" "}
                for a detailed view of the resources.
              </p>
              <h6 className="text-dark ml-0">
                <Moment date={Date.now()} format="MMM Do YYYY" />
              </h6>
              <Row>
                <Annotation
                  placement="left"
                  tooltip="This shows how models have performed on a specific track"
                >
                  <ModelLeaderBoard
                    {...this.props}
                    taskTitle={this.getFloresTaskTitle()}
                    taskId={this.state.taskId}
                  />
                </Annotation>
              </Row>
            </Col>
          </Row>
        </Container>
      </OverlayProvider>
    );
  }
}

export default FloresTaskPage;
