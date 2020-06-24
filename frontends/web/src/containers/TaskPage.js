import React from 'react';
import {
  Container,
  Row, Col,
  Card,
  CardGroup,
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

const LineChart = ({ size, data }) =>
  <C3Chart size={{ height: 150 }} data={{ json: data }} />;

class TaskMainPage extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <Row>
        <div className="col-sm-4">
          <h2 className="text-uppercase">Overall Model Leaderboard</h2>
          <Table striped bordered hover>
            <thead>
              <tr><th>Model</th><th>Mean accuracy</th></tr>
            </thead>
            <tbody>
              <tr><td><Link to="/models/1" className="btn-link">RoBERTa AllNLI</Link></td><td>89%</td></tr>
              <tr><td><Link to="/models/2" className="btn-link">XLNet AllNLI</Link></td><td>89%</td></tr>
            </tbody>
          </Table>
        </div>
        <div className="col-sm-4">
          <h2 className="text-uppercase">Trend</h2>
          <LineChart data={this.props.task.scores} />
          </div>
          <div className="col-sm-4">
          <h2 className="text-uppercase">Overall User Leaderboard</h2>
          <Table striped bordered hover>
            <thead>
              <tr><th>Model</th><th>Mean MER</th><th>Total</th></tr>
            </thead>
            <tbody>
              <tr><td><Link to="/users/1" className="btn-link">Douwe</Link></td><td>7%</td><td>3410</td></tr>
            </tbody>
          </Table>
        </div>
      </Row>
    );
  }
}

class TaskNav extends React.Component {
  render(props) {
    return (
      <Nav variant="tabs" defaultActiveKey="#overall">
        <Nav.Item>
          <Nav.Link href="#overall" className="btn-link">Overall</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#1" className="btn-link">Round 1</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#2" className="btn-link">Round 2</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#3" className="btn-link">Round 3</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#disabled" disabled>
            More to come..
          </Nav.Link>
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
      <Container>
        <Row>
          <h2 className="text-uppercase">{this.state.task.name}</h2><br/>
        </Row>
        <Row>
          <p style={{marginLeft: 8}}>{this.state.task.desc}</p>
        </Row>
        <Row>
          <CardGroup style={{marginTop: 20, width: '100%'}}>
            <Card>
              <Card.Header>
                <Nav variant="pills">
                  <Nav.Item>
                    <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderCreateTooltip}>
                      <Button as={Link} to={"/tasks/" + this.state.taskId + "/create"}>Create</Button>
                    </OverlayTrigger>
                  </Nav.Item>
                  <Nav.Item>&nbsp;</Nav.Item>
                  <Nav.Item>
                    <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderVerifyTooltip}>
                      <Button variant="secondary" as={Link} to={"/tasks/" + this.state.taskId + "/verify"}>Verify</Button>
                    </OverlayTrigger>
                  </Nav.Item>
                  <Nav.Item>&nbsp;</Nav.Item>
                  <Nav.Item>
                    <OverlayTrigger placement="bottom" delay={{ show: 250, hide: 400 }} overlay={renderSubmitTooltip}>
                      <Button variant="success" as={Link} to={"/tasks/" + this.state.taskId + "/submit"}>Submit</Button>
                    </OverlayTrigger>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body>

                <Card.Text>
                  {this.state.task.longdesc}
                </Card.Text>

                <Card>
                  <Card.Header>
                    <TaskNav task={this.state.task} />
                  </Card.Header>
                  <Card.Body>
                    <TaskMainPage task={this.state.task} />
                  </Card.Body>
                </Card>

              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default TaskPage;
