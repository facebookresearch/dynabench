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
  ButtonGroup,
  Nav,
  Table,
  Tooltip,
  OverlayTrigger,
  Pagination,
  DropdownButton,
  Dropdown
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import { LineRechart } from "../components/Rechart";
import { Avatar } from "../components/Avatar/Avatar";
import Moment from "react-moment";
import {
  OverlayProvider,
  Annotation,
  OverlayContext
} from "./Overlay";

const chartSizes = {
  xs: { fontSize: 10 },
  sm: {
    fontSize: 14,
    height: 300,
    left: -30,
    xAxisLeftPadding: 30,
  },
  md: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 30,
  },
  lg: {
    align: "center",
    fontSize: 14,
    height: 302,
    left: -20,
    xAxisLeftPadding: 50,
  },
  xl: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 50,
  },
};

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
      <Nav.Item>
        <Nav.Link
          href="#overall"
          className={`${
            currentHash === "#overall" ? "active" : ""
          } gray-color p-3 px-lg-5`}
        >
          Overall
        </Nav.Link>
      </Nav.Item>
      {roundNavs.map((item, id) => item)}
    </Nav>
  );
};

const TaskTrend = ({ data }) => {
  return (
    <>
      <Card className="my-4">
        <Card.Header className="p-3 light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">Trend</h2>
        </Card.Header>
        <Card.Body className="px-1 py-5">
          {/* Mobile / Tablet / Desktop charts */}
          <Col xs={12} className="d-block d-sm-none">
            <LineRechart size={chartSizes.xs} data={data} />
          </Col>
          <Col sm={12} className="d-none d-sm-block d-md-none">
            <LineRechart size={chartSizes.sm} data={data} />
          </Col>
          <Col md={12} className="d-none d-md-block d-lg-none">
            <LineRechart size={chartSizes.md} data={data} />
          </Col>
          <Col lg={12} className="d-none d-lg-block d-xl-none">
            <LineRechart size={chartSizes.lg} data={data} />
          </Col>
          <Col xl={12} className="d-none d-xl-block">
            <LineRechart size={chartSizes.xl} data={data} />
          </Col>
        </Card.Body>
      </Card>
    </>
  );
};

const RoundActionButtons = (props) => {
  // TODO: Display "Download data" button
  return null;
}

const TaskActionButtons = (props) => {
  function renderTooltip(props, text) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {text}
      </Tooltip>
    );
  }

  function renderCreateTooltip(props) {
    return renderTooltip(props, "Create new examples where the model fails");
  }
  function renderVerifyTooltip(props) {
     return renderTooltip(props, "Verify examples where the model may have failed");
  }
  function renderSubmitTooltip(props) {
    return renderTooltip(props, "Submit model predictions on this task");
  }

  return (
    <Nav className="my-4">
      <Nav.Item className="task-action-btn">
        <OverlayTrigger
          placement="bottom"
          delay={{ show: 250, hide: 400 }}
          overlay={renderCreateTooltip}
      >
        <Button
          as={Link}
          className="border-0 blue-color font-weight-bold light-gray-bg"
          to={"/tasks/" + props.taskId + "/create"}
        >
          Create Examples
        </Button>
      </OverlayTrigger>
    </Nav.Item>
    <Nav.Item className="task-action-btn">
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 250, hide: 400 }}
        overlay={renderVerifyTooltip}
      >
        <Button
          as={Link}
          className="border-0 blue-color font-weight-bold light-gray-bg"
          to={"/tasks/" + props.taskId + "/validate"}
        >
          Validate Examples
        </Button>
      </OverlayTrigger>
    </Nav.Item>
    {props.task.shortname === "NLI" ? (
      <Nav.Item className="task-action-btn">
        <OverlayTrigger
          placement="bottom"
          delay={{ show: 250, hide: 400 }}
          overlay={renderSubmitTooltip}
        >
          <Button
            as={Link}
            className="border-0 blue-color font-weight-bold light-gray-bg"
            to={"/tasks/" + props.taskId + "/submit"}
          >
            Submit Predictions
          </Button>
        </OverlayTrigger>
      </Nav.Item>
    ) : null}
    {props.uid === props.task.owner_uid ?
      <Nav.Item className="task-action-btn ml-auto">
        <DropdownButton className="border-0 blue-color font-weight-bold light-gray-bg" id="dropdown-basic-button" title="Export">
          <Dropdown.Item onClick={props.exportCurrentRoundData}>Export current round</Dropdown.Item>
          <Dropdown.Item onClick={props.exportAllTaskData}>Export all</Dropdown.Item>
        </DropdownButton>
      </Nav.Item>
      : null}
  </Nav>
  );
};

const OveralTaskStats = (props) => {
  return (
    <Table className="w-50 font-weight-bold ml-n2">
      <thead />
      <tbody>
        <tr>
          <td>Current round:</td>
          <td>{props.task.cur_round}</td>
        </tr>
        <tr>
          <td>Fooled/Collected (Model Error rate)</td>
          <td>
            {props.task.round?.total_verified}/
            {props.task.round?.total_collected} (
            {props.task.round?.total_collected > 0
              ? (100 *
                  props.task.round?.total_verified /
                  props.task.round?.total_collected
                ).toFixed(2)
              : "0.00"}
            %
            )
          </td>
        </tr>
        <tr>
          <td>Last activity:</td>
          <td>
            <Moment utc fromNow>
              {props.task.last_updated}
            </Moment>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

const OverallModelLeaderBoard = (props) => {
  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          <th>Model</th>
          <th>Mean accuracy</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((data) => {
          return (
            <tr key={data.model_id}>
              <td>
                <Link to={`/models/${data.model_id}`} className="btn-link">
                  {data.model_name}
                </Link>{" "}
                <Link
                  to={`/users/${data.owner_id}#profile`}
                  className="btn-link"
                >
                  ({data.owner})
                </Link>
              </td>
              <td>{parseFloat(data.accuracy).toFixed(2)}%</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const OverallUserLeaderBoard = (props) => {
  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          <th>User</th>
          <th>Mean MER</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {props.data.map((data) => {
          return (
            <tr key={data.uid}>
              <td>
                <Avatar
                  avatar_url={data.avatar_url}
                  username={data.username}
                  isThumbnail={true}
                  theme="blue"
                />
                <Link to={`/users/${data.uid}#profile`} className="btn-link">
                  {data.username}
                </Link>
              </td>
              <td>{data.MER}%</td>
              <td>{data.total}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

class RoundDescription extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.getRoundInfo = this.getRoundInfo.bind(this);
  }
  componentDidMount() {
    this.getRoundInfo();
  }
  getRoundInfo() {
    if (this.props.round_id) {
    this.props.api.getTaskRound(this.props.task_id, this.props.round_id)
      .then((result) => {
        this.setState({ round: result });
      }, (error) => {
        console.log(error);
      });
    }
  }
  componentDidUpdate(prevProps) {
    if (prevProps.round_id !== this.props.round_id) {
      this.getRoundInfo();
    }
  }
  render() {
    return <div dangerouslySetInnerHTML={{__html: this.state.round?.longdesc}}></div>;
  }
}

class TaskPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: props.match.params.taskId,
      task: {},
      trendScore: [],
      modelLeaderBoardData: [],
      userLeaderBoardData: [],
      modelLeaderBoardPage: 0,
      isEndOfModelLeaderPage: true,
      userLeaderBoardPage: 0,
      isEndOfUserLeaderPage: true,
      pageLimit: 5,
    };

    this.exportAllTaskData = this.exportAllTaskData.bind(this);
    this.exportCurrentRoundData = this.exportCurrentRoundData.bind(this);
  }

  componentDidMount() {
    this.context.api
      .getTask(this.state.taskId)
      .then((result) => {
        this.setState({task: result, displayRoundId: result.cur_round, round: result.round}, function() {
          this.refreshData();
        });
      }, (error) => {
        console.log(error);
      });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.refreshData();
    }
  }

  refreshData() {
    this.setState(
      {
        modelLeaderBoardPage: 0,
        isEndOfModelLeaderPage: true,
        userLeaderBoardPage: 0,
        isEndOfUserLeaderPage: true,
        displayRoundId: this.props.location.hash !== '#overall' ? this.props.location.hash.slice(1) : this.state.task.cur_round,
      },
      () => {
        this.fetchOverallModelLeaderboard(this.state.modelLeaderBoardPage);
        this.fetchOverallUserLeaderboard(this.state.userLeaderBoardPage);
        if (this.props.location.hash === "#overall") this.fetchTrend();
      }
    );
  }

  exportAllTaskData() {
    return this.context.api.exportData(this.state.task.id);
  }

  exportCurrentRoundData() {
    return this.context.api.exportData(this.state.task.id, this.state.task.cur_round);
  }

  fetchTrend() {
    this.context.api
      .getTrends(this.state.taskId)
      .then((result) => {
        this.setState({
          trendScore: result,
        });
      }, (error) => {
        console.log(error);
      });
  }

  fetchOverallModelLeaderboard(page) {
    this.context.api
      .getOverallModelLeaderboard(
        this.state.taskId,
        this.props.location.hash.replace("#", ""),
        this.state.pageLimit,
        page
      )
      .then((result) => {
        const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
        this.setState({
          isEndOfModelLeaderPage: isEndOfPage,
          modelLeaderBoardData: result.data,
        });
      }, (error) => {
        console.log(error);
      });
  }

  fetchOverallUserLeaderboard(page) {
    this.context.api
      .getOverallUserLeaderboard(
        this.state.taskId,
        this.props.location.hash.replace("#", ""),
        this.state.pageLimit,
        page
      )
      .then((result) => {
        const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
        this.setState({
          isEndOfUserLeaderPage: isEndOfPage,
          userLeaderBoardData: result.data,
        });
      }, (error) => {
        console.log(error);
      });
  }

  paginate = (component, state) => {
    const componentPageState =
      component === "model" ? "modelLeaderBoardPage" : "userLeaderBoardPage";
    this.setState(
      {
        [componentPageState]:
          state === "next"
            ? ++this.state[componentPageState]
            : --this.state[componentPageState],
      },
      () => {
        if (component === "model") {
          this.fetchOverallModelLeaderboard(this.state[componentPageState]);
        } else {
          this.fetchOverallUserLeaderboard(this.state[componentPageState]);
        }
      }
    );
  };

  render() {
    function renderTooltip(props, text) {
      return (
        <Tooltip id="button-tooltip" {...props}>
          {text}
        </Tooltip>
      );
    }

    function renderCreateTooltip(props) {
      return renderTooltip(props, "Create new examples where the model fails");
    }
    // function renderVerifyTooltip(props) {
    //   return renderTooltip(
    //     props,
    //     "Verify examples where we think the model failed"
    //   );
    // }
    function renderSubmitTooltip(props) {
      return renderTooltip(props, "Submit model predictions on this task");
    }

    return (
      <OverlayProvider delayMs="1700">
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Annotation placement="bottom-start" tooltip="Dynabench tasks happen over multiple rounds. You can look at previous rounds here.">
              <TaskNav {...this.props} taskDetail={this.state.task} />
            </Annotation>
          </Col>
          <Col lg={10} className="px-4 px-lg-5">
            <h2 className="task-page-header text-reset ml-0">
              {this.state.task.name}
            </h2>
            <div style={{float: "right", marginTop: 30}}>
            <ButtonGroup>
            <OverlayContext.Consumer>
              {
                ({hidden, setHidden})=> (
                    <button type="button" className="btn btn-light btn-sm"
                      onClick={() => { setHidden(!hidden) }}
                    ><i className="fas fa-question"></i></button>
                )
              }
            </OverlayContext.Consumer>
            {/* <button type="button" className="btn btn-light btn-sm"
              onClick={() => {  }}
            ><i className="fas fa-info"></i></button> */}
            </ButtonGroup>
            </div>
            <p>{this.state.task.desc}</p>
            {this.props.location.hash === "#overall" ? (
              <>
                <OveralTaskStats task={this.state.task}/>
                <hr />
                <TaskActionButtons
                  taskId={this.state.taskId}
                  uid={this.context.user.id}
                  task={this.state.task}
                  exportCurrentRoundData={this.exportCurrentRoundData}
                  exportCurrentRoundData={this.exportCurrentRoundData}
                />
              </>
            ) :
              <>
                <hr />
                <RoundActionButtons
                  taskId={this.state.taskId}
                />
              </>}

            <Row>
              <Col xs={12} md={12}>
                <RoundDescription
                  api={this.context.api}
                  task_id={this.state.taskId}
                  cur_round={this.state.task.cur_round}
                  round_id={this.state.displayRoundId} />
              </Col>
            </Row>
            <Row>
              <Col xs={12} md={6}>
                {this.state.modelLeaderBoardData.length ? (
                  <Annotation placement="left" tooltip="This shows how models have performed on this task - the top-performing models are the ones we’ll use for the next round">
                  <Card className="my-4">
                    <Card.Header className="p-3 light-gray-bg">
                      <h2 className="text-uppercase m-0 text-reset">
                        Overall Model Leaderboard
                      </h2>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <OverallModelLeaderBoard
                        data={this.state.modelLeaderBoardData}
                      />
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <Pagination className="mb-0 float-right" size="sm">
                        <Pagination.Item
                          disabled={!this.state.modelLeaderBoardPage}
                          onClick={() => this.paginate("model", "previous")}
                        >
                          Previous
                        </Pagination.Item>
                        <Pagination.Item
                          disabled={this.state.isEndOfModelLeaderPage}
                          onClick={() => this.paginate("model", "next")}
                        >
                          Next
                        </Pagination.Item>
                      </Pagination>
                    </Card.Footer>
                  </Card>
                  </Annotation>
                ) : null}
                {this.state.userLeaderBoardData.length ? (
                  <Annotation placement="left" tooltip="This shows how well our users did on this task">
                  <Card className="my-4">
                    <Card.Header className="p-3 light-gray-bg">
                      <h2 className="text-uppercase m-0 text-reset">
                        Overall User Leaderboard
                      </h2>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <OverallUserLeaderBoard
                        data={this.state.userLeaderBoardData}
                      />
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <Pagination className="mb-0 float-right" size="sm">
                        <Pagination.Item
                          disabled={!this.state.userLeaderBoardPage}
                          onClick={() => this.paginate("user", "previous")}
                        >
                          Previous
                        </Pagination.Item>
                        <Pagination.Item
                          disabled={this.state.isEndOfUserLeaderPage}
                          onClick={() => this.paginate("user", "next")}
                        >
                          Next
                        </Pagination.Item>
                      </Pagination>
                    </Card.Footer>
                  </Card>
                  </Annotation>
                ) : null}
              </Col>
              <Col xs={12} md={6}>
                {this.props.location.hash === "#overall" &&
                this.state.trendScore.length ? (
                  <Annotation placement="top-end" tooltip="As tasks progress over time, we can follow their trend, which is shown here">
                    <TaskTrend data={this.state.trendScore} />
                  </Annotation>
                ) : null}
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
      </OverlayProvider>
    );
  }
}

export default TaskPage;
