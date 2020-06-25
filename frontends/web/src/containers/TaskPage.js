import React from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardGroup,
  Button,
  Nav,
  Table,
  Tooltip,
  OverlayTrigger,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import UserContext from './UserContext';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Rechart = ({ size, data }) => {
  console.log('data:', data);
  return (
    <div className="col-sm-12 col-md-12">
      <Card>
        <Card.Header>Trend</Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickCount={8} />
              <ChartTooltip />
              <Legend
                align="right"
                verticalAlign="top"
                layout="vertical"
                wrapperStyle={{ paddingLeft: 10 }}
              />
              <Line
                type="monotone"
                dataKey="data1"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="data2"
                stroke="#ffa500"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="data3"
                stroke="#228B22"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
  );
};

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
              <tr>
                <th>Model</th>
                <th>Mean accuracy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Link to="/models/1" className="btn-link">
                    RoBERTa AllNLI
                  </Link>
                </td>
                <td>89%</td>
              </tr>
              <tr>
                <td>
                  <Link to="/models/2" className="btn-link">
                    XLNet AllNLI
                  </Link>
                </td>
                <td>89%</td>
              </tr>
            </tbody>
          </Table>
        </div>
        <div className="col-sm-4">
          <h2 className="text-uppercase">Trend</h2>
          <Rechart data={this.props.task.scores} />
        </div>
        <div className="col-sm-4">
          <h2 className="text-uppercase">Overall User Leaderboard</h2>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Model</th>
                <th>Mean MER</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Link to="/users/1" className="btn-link">
                    Douwe
                  </Link>
                </td>
                <td>7%</td>
                <td>3410</td>
              </tr>
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
      <Nav defaultActiveKey="#overall" className="flex-column">
        <Nav.Item>
          <Nav.Link href="#overall" className="btn-link">
            Overall
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#1" className="btn-link">
            Round 1
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#2" className="btn-link">
            Round 2
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link href="#3" className="btn-link">
            Round 3
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
        scores: [
          {
            name: '0',
            data1: 30,
            data2: 23,
            data3: 22,
          },
          {
            name: '1',
            data1: 20,
            data2: 45,
            data3: 23,
          },
          {
            name: '2',
            data1: 50,
            data2: 56,
            data3: 21,
          },
          {
            name: '3',
            data1: 40,
            data2: 68,
            data3: 43,
          },
        ],
      },
    };
  }
  componentDidMount() {
    // const { match: { params } } = this.props;
    // this.setState(params, function() {
    //   this.context.api.getTask(this.state.taskId)
    //   .then(result => {
    //     console.log(result);
    //     this.setState({task: result});
    //   })
    //   .catch(error => {
    //     console.log(error);
    //   });
    // });
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
      return renderTooltip(props, 'Create new examples where the model fails');
    }
    function renderVerifyTooltip(props) {
      return renderTooltip(
        props,
        'Verify examples where we think the model failed'
      );
    }
    function renderSubmitTooltip(props) {
      return renderTooltip(props, 'Submit model predictions on this task');
    }
    return (
      <Container fluid>
        <Row>
          <Col xs={2} className="sidebar-wrapper">
            <TaskNav task={this.state.task} />
          </Col>
          <Col xs={10} className="page-content-wrapper">
            <Container fluid>
              <Row>
                <h2>{this.state.task.name}</h2>
                <br />
              </Row>
              <Row>
                <p style={{ marginLeft: 8 }}>{this.state.task.desc}</p>
              </Row>
              <Row>
                <CardGroup style={{ marginTop: 20, width: '100%' }}>
                  <Card>
                    <Card.Header>
                      <Nav variant="pills">
                        <Nav.Item>
                          <OverlayTrigger
                            placement="bottom"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderCreateTooltip}
                          >
                            <Button
                              as={Link}
                              to={'/tasks/' + this.state.taskId + '/create'}
                            >
                              Create
                            </Button>
                          </OverlayTrigger>
                        </Nav.Item>
                        <Nav.Item>&nbsp;</Nav.Item>
                        <Nav.Item>
                          <OverlayTrigger
                            placement="bottom"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderVerifyTooltip}
                          >
                            <Button
                              variant="secondary"
                              as={Link}
                              to={'/tasks/' + this.state.taskId + '/verify'}
                            >
                              Verify
                            </Button>
                          </OverlayTrigger>
                        </Nav.Item>
                        <Nav.Item>&nbsp;</Nav.Item>
                        <Nav.Item>
                          <OverlayTrigger
                            placement="bottom"
                            delay={{ show: 250, hide: 400 }}
                            overlay={renderSubmitTooltip}
                          >
                            <Button
                              variant="success"
                              as={Link}
                              to={'/tasks/' + this.state.taskId + '/submit'}
                            >
                              Submit
                            </Button>
                          </OverlayTrigger>
                        </Nav.Item>
                      </Nav>
                    </Card.Header>
                    <Card.Body>
                      <Card.Text>{this.state.task.longdesc}</Card.Text>

                      <Card>
                        <Card.Header></Card.Header>
                        <Card.Body>
                          <TaskMainPage task={this.state.task} />
                        </Card.Body>
                      </Card>
                    </Card.Body>
                  </Card>
                </CardGroup>
              </Row>
            </Container>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TaskPage;
