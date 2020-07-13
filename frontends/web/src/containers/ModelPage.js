import React from "react";
import {
  Container,
  Row,
  Badge,
  Col,
  Card,
  Button,
  Table,
} from "react-bootstrap";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";

class ModelPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      ctxUserId: null,
      modelId: this.props.match.params.modelId,
      model: {
        name: "",
        user: {
          username: "",
        },
        accuracy: null,
      },
    };
  }

  componentDidMount() {
    const user = this.context.api.getCredentials();
    this.setState({ ctxUserId: user.id });
    this.fetchModel();
  }

  fetchModel = () => {
    this.context.api
      .getModel(this.state.modelId)
      .then((result) => {
        this.setState({ model: result });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  handlePublish = () => {
    return this.context.api
      .updateModel(this.state.modelId, { is_published: true })
      .then(() => {
        this.fetchModel();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  handleUnpublish = () => {
    return this.context.api
      .updateModel(this.state.modelId, { is_published: false })
      .then(() => {
        this.fetchModel();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    const isModelOwner =
      parseInt(this.state.model.user.id) === parseInt(this.state.ctxUserId);
    const { model } = this.state;
    const { scores } = this.state.model;
    let orderedScores = Object.keys(scores || []).sort((a, b) => a - b);
    orderedScores = orderedScores.map((round) => {
      return { round: round, score: scores[round] };
    });
    return (
      <Container>
        <h1 className="my-4 pt-3 text-uppercase text-center">Model Overview</h1>
        <Col className="m-auto" lg={8}>
          <Card className="profile-card">
            <Card.Body>
              <div className="d-flex justify-content-between mx-4 mt-4">
                <h5>
                  {model.name}
                  {isModelOwner && model.is_published === "True" ? (
                    <Badge variant="success" className="ml-2">
                      Published
                    </Badge>
                  ) : null}
                  {isModelOwner && model.is_published === "False" ? (
                    <Badge variant="danger" className="ml-2">
                      Unpublished
                    </Badge>
                  ) : null}
                </h5>
                <div>
                  <Button
                    className={`blue-bg border-0 font-weight-bold ${
                      isModelOwner ? "mr-2" : null
                    }`}
                    aria-label="Back"
                    onClick={this.props.history.goBack}
                  >
                    {"< Back"}
                  </Button>
                  {isModelOwner && model.is_published === "True" ? (
                    <Button
                      variant="outline-danger"
                      onClick={() => this.handleUnpublish(model)}
                    >
                      Unpublish
                    </Button>
                  ) : null}
                  {isModelOwner && model.is_published === "False" ? (
                    <Button
                      variant="outline-success"
                      onClick={() => this.handlePublish(model)}
                    >
                      Publish
                    </Button>
                  ) : null}
                </div>
              </div>
              {model.id ? (
                <Table className="mb-0">
                  <thead />
                  <tbody>
                    <tr>
                      <td>
                        <b>Owner</b>
                      </td>
                      <td>{model.user && model.user.username}</td>
                    </tr>
                    <tr>
                      <td>
                        <b>Task</b>
                      </td>
                      <td>
                        <TasksContext.Consumer>
                          {({ tasks }) => {
                            const task =
                              model && tasks.filter((e) => e.id == model.tid);
                            return task && task.length && task[0].shortname;
                          }}
                        </TasksContext.Consumer>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="2">
                        <div>Performance</div>
                        <Container>
                          <Row className="mt-4">
                            <Col sm="5" className="mb-2 ">
                              Overall Accuracy
                            </Col>
                            <Col sm="7">{model.overall_perf}%</Col>
                          </Row>
                          {orderedScores.map((data) => {
                            return (
                              <Row key={data.round}>
                                <Col sm="5" className="row-wise">
                                  Round {data.round}
                                </Col>
                                <Col sm="7">{data.score}%</Col>
                              </Row>
                            );
                          })}
                        </Container>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              ) : (
                <Container>
                  <Row>
                    <Col className="my-4 text-center">No Data Found</Col>
                  </Row>
                </Container>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export default ModelPage;
