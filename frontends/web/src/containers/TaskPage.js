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

        {/* Mobile / Tablet / Desktop charts */}
        <div className="col-sm-12 d-block d-sm-none">
          <Rechart size={chartSizes.xs} data={this.props.task.scores} />
        </div>
        <div className="col-12 d-none d-sm-block d-md-none">
          <Rechart size={chartSizes.sm} data={this.props.task.scores} />
        </div>
        <div className="col-12 d-none d-md-block d-lg-none">
          <Rechart size={chartSizes.md} data={this.props.task.scores} />
        </div>
        <div className="col-12 d-none d-lg-block d-xl-none">
          <Rechart size={chartSizes.lg} data={this.props.task.scores} />
        </div>
        <div className="col-12 d-none d-xl-block">
          <Rechart size={chartSizes.xl} data={this.props.task.scores} />
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
            name: 0,
            data1: 30,
            data2: 23,
            data3: 22,
          },
          {
            name: 1,
            data1: 20,
            data2: 45,
            data3: 23,
          },
          {
            name: 2,
            data1: 50,
            data2: 56,
            data3: 21,
          },
          {
            name: 3,
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
                      <TaskMainPage task={this.state.task} />
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

// Defaults for mobile
const Rechart = ({
  size: {
    align = 'center',
    fontSize = 10,
    height = 250,
    left = -40,
    legendAlign = null,
    right = 10,
    verticalAlign = 'bottom',
    width = '100%',
    xAxisLeftPadding = 25,
  },
  data,
}) => {
  return (
    <Card>
      <Card.Header>Trend</Card.Header>
      <Card.Body>
        <ResponsiveContainer width={width} height={height}>
          <LineChart margin={{ left, right }} data={data}>
            <XAxis
              allowDecimals={false}
              dataKey="name"
              padding={{ left: xAxisLeftPadding }}
              tick={{ fontSize }}
              tickLine={false}
            />
            <YAxis
              interval="preserveStartEnd"
              tick={false}
              padding={{ top: 10 }}
              tick={{ fontSize }}
            />
            <ChartTooltip />
            <Legend
              align={align}
              layout={verticalAlign == 'top' ? 'vertical' : 'horizontal'}
              wrapperStyle={{
                fontSize,
                right: legendAlign,
              }}
              verticalAlign={verticalAlign}
            />
            <Line
              dataKey="data1"
              dot={{ fill: '#6fb98f' }}
              stroke="#6fb98f"
              strokeWidth={2}
              type="linear"
            />
            <Line
              dataKey="data2"
              dot={{ fill: '#075756' }}
              stroke="#075756"
              strokeWidth={2}
              type="linear"
            />
            <Line
              dataKey="data3"
              dot={{ fill: '#66a5ad' }}
              stroke="#66a5ad"
              strokeWidth={2}
              type="linear"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card.Body>
    </Card>
  );
};

const chartSizes = {
  xs: { fontSize: 10, legendAlign: -10 },
  sm: {
    align: 'center',
    fontSize: 14,
    height: 300,
    left: -30,
    xAxisLeftPadding: 50,
  },
  md: {
    align: 'right',
    fontSize: 14,
    height: 332,
    left: -20,
    legendAlign: -35,
    verticalAlign: 'top',
    width: '90%',
    xAxisLeftPadding: 50,
  },
  lg: {
    fontSize: 14,
    height: 492,
    left: -20,
    legendAlign: -35,
    width: 700,
    verticalAlign: 'top',
    align: 'right',
    xAxisLeftPadding: 50,
  },
  xl: {
    align: 'right',
    fontSize: 14,
    height: 492,
    left: -20,
    legendAlign: -100,
    width: 700,
    verticalAlign: 'top',
    xAxisLeftPadding: 50,
  },
};

export default TaskPage;
