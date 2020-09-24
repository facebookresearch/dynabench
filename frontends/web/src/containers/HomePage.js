/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Col,
  Container,
  Row,
  Jumbotron,
  Table,
  Button,
  Card,
  CardGroup,
  Modal
} from "react-bootstrap";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import TasksContext from "./TasksContext";
import "./HomePage.css";
import Moment from "react-moment";
import ReactPlayer from "react-player";

class HomePageTable extends React.Component {
  render() {
    return (
      <>
        <h2 className="text-uppercase">{this.props.title}</h2>
        <Table striped bordered hover>
          <thead>{this.props.th}</thead>
          <tbody>{this.props.items}</tbody>
        </Table>
      </>
    );
  }
}

class TaskTable extends React.Component {
  static contextType = UserContext;
  state = {
    tasks: [],
  };
  componentDidMount() {
    this.context.api
      .getTasks()
      .then((result) => {
        this.setState({ tasks: result.tasks });
      }, (error) => {
        console.log(error);
      });
  }
  render() {
    const headItems = (
      <tr>
        <th>Task</th>
        <th>Stats</th>
      </tr>
    );
    const taskItems = this.state.tasks.map((task) => (
      <tr key={task.id}>
        <td>
          <Link className="btn-link" to={"/tasks/" + task.id}>
            {task.name}
          </Link>
        </td>
        <td>{task.stats}</td>
      </tr>
    ));
    return <HomePageTable title="Tasks" th={headItems} items={taskItems} />;
  }
}

class UserTable extends React.Component {
  static contextType = UserContext;
  state = {
    users: [],
  };
  componentDidMount() {
    this.context.api
      .getUsers()
      .then((result) => {
        this.setState({ users: result });
      }, (error) => {
        console.log(error);
      });
  }
  render() {
    const headItems = (
      <tr>
        <th>User</th>
        <th>Stats</th>
      </tr>
    );
    const userItems = this.state.users.map((user) => (
      <tr key={user.id}>
        <td>
          <Link className="btn-link" to={"/users/" + user.id}>
            {user.username}
          </Link>
        </td>
        <td>n/a</td>
      </tr>
    ));
    return <HomePageTable title="Users" th={headItems} items={userItems} />;
  }
}

class HomePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      showjumbo: true,
      tasks: [],
      showVideo: false
    };
    this.hideJumbo = this.hideJumbo.bind(this);
  }
  hideJumbo() {
    this.setState({ showjumbo: false });
  }
  render() {
    const taskCards = (tasks) =>
      !tasks ? (
        <p>No tasks found</p>
      ) : (
        tasks.map((task, index) => (
          <Col sm={6} lg={3} key={task.id}>
            <Card
              key={task.id}
              className="task-card"
              onClick={() =>
                this.props.history.push(`/tasks/${task.id}#overall`)
              }
            >
              <h2 className="task-header blue-color text-uppercase text-center">
                {task.name}
              </h2>
              <Card.Body>
                <Card.Text className="text-center">{task.desc}</Card.Text>
                <Table>
                  <thead></thead>
                  <tbody>
                    <tr>
                      <td>Round:</td>
                      <td>{task.cur_round}</td>
                    </tr>
                    <tr>
                      <td>Model error rate:</td>
                      <td>
                        {task.round.total_collected > 0
                          ? ( 100 *
                              task.round.total_fooled /
                              task.round.total_collected
                            ).toFixed(2)
                          : "0.00"}
                        % (
                        {task.round.total_fooled}/{task.round.total_collected}
                        )
                      </td>
                    </tr>
                    <tr>
                      <td>Last activity:</td>
                      <td>
                        <Moment utc fromNow>
                          {task.last_updated}
                        </Moment>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        ))
      );
    return (
      <>
        <Jumbotron
          className={
            "pb-0 bg-white jumbo-slider " +
            (this.state.showjumbo ? "" : "hide-jumbo")
          }
        >
          <Container>
            <Row className="justify-content-center text-center">
              <Col lg={8}>
                <h1 className="mb-4">Rethinking AI Benchmarking</h1>
                <p>
                  Dynabench is a research platform for dynamic data collection
                  and benchmarking. Static benchmarks have well-known issues:
                  they saturate quickly, are susceptible to overfitting, contain
                  exploitable annotator artifacts and have unclear or imperfect
                  evaluation metrics.<br></br>
                  <br></br> This platform in essence is a scientific experiment:
                  can we make faster progress if we collect data dynamically,
                  with humans and models in the loop, rather than in the
                  old-fashioned static way?
                </p>
                <Modal
                  show={this.state.showVideo}
                  centered
                  backdropClassName="badge-backdrop"
                  onHide={() => {
                    this.setState({ showVideo: false });
                  }}
                  dialogAs={({ children }) => (
                    <div style={{ pointerEvents: "none" }}>{children}</div>
                  )}
                >
                  <ReactPlayer
                    url="https://dynabench-us-west-1-096166425824.s3-us-west-1.amazonaws.com/public/explainer.mp4"
                    controls
                    playing
                    width="80vw"
                    height="80vh"
                    style={{
                      pointerEvents: "all",
                      margin: "10vh auto 0",
                      backgroundColor: "black",
                    }}
                  />
                </Modal>

                <img
                  onClick={() => {
                    this.setState({ showVideo: true });
                  }}
                  src="/vid_thumb.png"
                  className="video-thumbnail"
                />

                <div>
                  <Button
                    variant="primary"
                    as={Link}
                    className="button-ellipse blue-bg home-readmore-btn border-0"
                    to="/about"
                  >
                    Read more
                  </Button>
                </div>
              </Col>
            </Row>
          </Container>
        </Jumbotron>
        <Container className="pb-4 pb-sm-5">
          <h2 className="home-cardgroup-header text-reset mt-0 mb-4 font-weight-light d-block text-center">
            Tasks
          </h2>
          <CardGroup>
            <TasksContext.Consumer>
              {({ tasks }) => (tasks.length ? taskCards(tasks) : "")}
            </TasksContext.Consumer>
          </CardGroup>
        </Container>
      </>
    );
  }
}

export default HomePage;
