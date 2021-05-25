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

const TaskNav = (props) => {
  const rounds = (props.taskDetail.round && props.taskDetail.cur_round) || 0;
  const roundNavs = [];
  const currentHash = props.location.hash;
  for (let i = 1; i <= rounds; i++) {
    roundNavs.push(
      <Nav.Item key={i}>
        <Nav.Link
          href={`#${i}`}
          className={`${
            currentHash === `#${i}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Round {i}
        </Nav.Link>
      </Nav.Item>
    );
  }
  return (
    <Nav className="flex-lg-column sidebar-wrapper sticky-top">
      {roundNavs.map((item, id) => item)}
      <Nav.Item>
        <Nav.Link
          href={`#${1}`}
          className={`${
            currentHash === `#${1}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Large Track
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          href={`#${2}`}
          className={`${
            currentHash === `#${2}` ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Small Track 1
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link
          href={`#${3}`}
          className={`${
            currentHash === `#${3}` ? "active" : ""
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
      taskId: props.match.params.taskId,
      task: {},
      modelLeaderBoardData: [],
      modelLeaderBoardTags: [],
      modelLeaderBoardPage: 0,
      isEndOfModelLeaderPage: true,
      pageLimit: 5,
    };
  }

  /*componentDidMount() {
    this.setState({ taskId: this.props.match.params.taskId }, function () {
      this.context.api.getTask(this.state.taskId).then(
        (result) => {
          this.setState(
            {
              task: result,
              displayRoundId: result.cur_round,
              round: result.round,
            },
            function () {
              this.refreshData();
              this.getSavedTaskSettings();
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

  componentDidUpdate(prevProps) {
    if (
      prevProps.location.hash !== this.props.location.hash ||
      this.props.match.params.taskId !== this.state.taskId
    ) {
      this.setState({ taskId: this.props.match.params.taskId }, function () {
        this.context.api.getTask(this.state.taskId).then(
          (result) => {
            this.setState(
              {
                task: result,
                displayRoundId: result.cur_round,
                round: result.round,
              },
              function () {
                this.refreshData();
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
  }*/

  refreshData() {
    if (!this.props.location.hash || this.props.location.hash === "")
      this.props.location.hash = "#overall";
    this.setState(
      {
        modelLeaderBoardPage: 0,
        isEndOfModelLeaderPage: true,
      },
      () => {
        this.fetchOverallUserLeaderboard(this.state.userLeaderBoardPage);
        if (this.props.location.hash === "#overall") this.fetchTrend();
      }
    );
  }

  getTitleTask = () => {
    const task = this.props.location.hash;
    switch (task) {
      case "#1":
        return "Large Track";
      case "#2":
        return "Small Track 1";
      case "#3":
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
              <FloresActionButtons api={""} taskId={""} user={""} task={""} />
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

              <ModelLeaderBoard taskTitle={this.getTitleTask()} />
            </Col>
          </Row>
        </Container>
      </OverlayProvider>
    );
  }
}

export default FloresTaskPage;
