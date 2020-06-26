import React from 'react';
import {
  Container,
  Row, Col,
  Card,
  Button,
  Nav,
  Table,
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

import UserContext from './UserContext';

import C3Chart from 'react-c3js';
//import 'c3/c3.css';
import Moment from 'react-moment';

const LineChart = ({ data }) => <C3Chart data={{ json: data }} />;

class TaskMainPage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <>
        <Card className="my-4">
          <Card.Header className="p-3 light-gray-bg">
            <h2 className="text-uppercase m-0 text-reset">Trend</h2>
          </Card.Header>
          <Card.Body className="p-3">
            <LineChart data={this.props.task.scores} />
          </Card.Body>
        </Card>
        <Card className="my-4">
          <Card.Header className="p-3 light-gray-bg">
            <h2 className="text-uppercase m-0 text-reset">Overall Model Leaderboard</h2>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover>
              <thead>
                <tr><th>Model</th><th>Mean accuracy</th></tr>
              </thead>
              <tbody>
                <tr><td><Link to="/models/1" className="btn-link">RoBERTa AllNLI</Link></td><td>89%</td></tr>
                <tr><td><Link to="/models/2" className="btn-link">XLNet AllNLI</Link></td><td>89%</td></tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <Card className="my-4">
          <Card.Header className="p-3 light-gray-bg">
            <h2 className="text-uppercase m-0 text-reset">Overall User Leaderboard</h2>
          </Card.Header>
          <Card.Body className="p-0">
            <Table hover>
              <thead>
                <tr><th>Model</th><th>Mean MER</th><th>Total</th></tr>
              </thead>
              <tbody>
                <tr><td><Link to="/users/1" className="btn-link">Douwe</Link></td><td>7%</td><td>3410</td></tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  }
}

class TaskNav extends React.Component {
  render(props) {
    return (
      <Nav defaultActiveKey="#overall" className="flex-lg-column sidebar-wrapper sticky-top">
        <Nav.Item>
          <Nav.Link href="#overall" className="gray-color p-3 px-lg-5">Overall</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#1" className="gray-color p-3 px-lg-5">Round 1</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#2" className="gray-color p-3 px-lg-5">Round 2</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#3" className="gray-color p-3 px-lg-5">Round 3</Nav.Link>
        </Nav.Item>
      </Nav>
    );
  }
}

class TaskPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {
        scores: {
          data1: [30, 20, 50, 40],
          data2: [23, 45, 56, 68],
          data3: [22, 23, 21, 43]
        }
      }
    };
  }
  componentDidMount() {
    const { match: { params } } = this.props;
    this.setState(params, function() {
      this.context.api.getTask(this.state.taskId)
      .then(result => {
        this.setState({task: result});
      })
      .catch(error => {
        console.log(error);
      });
    });
  }
  render() {
    function renderTooltip(props, text) {
      return (
        <Tooltip id="button-tooltip" {...props}>
          {text}
        </Tooltip>
      );
    }
    function renderCreateTooltip(props) {
      return renderTooltip(props, "Create new examples where the model fails")
    }
    function renderVerifyTooltip(props) {
      return renderTooltip(props, "Verify examples where we think the model failed")
    }
    function renderSubmitTooltip(props) {
      return renderTooltip(props, "Submit model predictions on this task")
    }
    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <TaskNav task={this.state.task} />
          </Col>
          <Col lg={10} className="px-4 px-lg-5">
            <h2 className="task-page-header text-reset ml-0">{this.state.task.name}</h2>
            <p>{this.state.task.desc}</p>
            <Table className="w-50 font-weight-bold ml-n2">
              <thead />
              <tbody>
                <tr><td>Round:</td><td>{this.state.task.cur_round}</td></tr>
                <tr><td>Verified/Collected</td><td>{this.state.task.round?.total_verified}/{this.state.task.round?.total_collected}</td></tr>
                <tr><td>(Model error rate):</td><td>({this.state.task.round?.total_collected > 0 ? (this.state.task.round?.total_verified / this.state.task.round?.total_collected).toFixed(2) : '0.00'}%)</td></tr>
                <tr><td>Last update:</td><td><Moment utc fromNow>{this.state.task.last_updated}</Moment></td></tr>
              </tbody>
            </Table>
            <hr />
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
                    to={"/tasks/" + this.state.taskId + "/create"}
                  >
                    Create
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
                    to={"/tasks/" + this.state.taskId + "/verify"}
                  >
                    Verify
                  </Button>
                </OverlayTrigger>
              </Nav.Item>
              <Nav.Item className="task-action-btn">
                <OverlayTrigger
                  placement="bottom"
                  delay={{ show: 250, hide: 400 }}
                  overlay={renderSubmitTooltip}
                >
                  <Button
                    as={Link}
                    className="border-0 blue-color font-weight-bold light-gray-bg"
                    to={"/tasks/" + this.state.taskId + "/submit"}
                  >
                    Submit
                  </Button>
                </OverlayTrigger>
              </Nav.Item>
            </Nav>
            <TaskMainPage task={this.state.task} />
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TaskPage;
