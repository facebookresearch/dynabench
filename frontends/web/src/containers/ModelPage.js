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

  handleEdit = () => {
    this.props.history.push({
      pathname: `/tasks/${this.state.model.tid}/models/${this.state.model.id}/publish`,
      state: { detail: this.state.model },
    });
  };

  togglePublish = () => {
    const modelName = this.state.model.name;
    if (!modelName || modelName === "") {
      this.props.history.push({
        pathname: `/tasks/${this.state.model.tid}/models/${this.state.model.id}/publish`,
        state: { detail: this.state.model },
      });
      return;
    }
    return this.context.api
      .toggleModelStatus(this.state.modelId)
      .then(() => {
        this.fetchModel();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  handleBack = () => {
    const propState = this.props.location.state;
    if (propState && propState.src === "publish") {
      this.props.history.push("/account#models");
    } else {
      this.props.history.goBack();
    }
  };

  render() {
    const isModelOwner =
      parseInt(this.state.model.user.id) === parseInt(this.state.ctxUserId);
    const { model } = this.state;
    const { scores } = this.state.model;
    let orderedScores = (scores || []).sort((a, b) => a.round_id - b.round_id);
    return (
      <Container>
        <h1 className="my-4 pt-3 text-uppercase text-center">Model Overview</h1>
        <Col className="m-auto" lg={8}>
          <Card className="profile-card">
            <Card.Body>
              <div className="d-flex justify-content-between mx-4 mt-4">
                <Button
                  className={`blue-bg border-0 font-weight-bold ${
                    isModelOwner ? "mr-2" : null
                  }`}
                  aria-label="Back"
                  onClick={this.handleBack}
                >
                  {"< Back"}
                </Button>
                <div>
                  {isModelOwner && (
                    <Button
                      variant="outline-primary mr-2"
                      onClick={() => this.handleEdit()}
                    >
                      Edit
                    </Button>
                  )}
                  {isModelOwner && model.is_published === "True" ? (
                    <Button
                      variant="outline-danger"
                      onClick={() => this.togglePublish()}
                    >
                      Unpublish
                    </Button>
                  ) : null}
                  {isModelOwner &&
                  model.is_published === "False" &&
                  model.name ? (
                    <Button
                      variant="outline-success"
                      onClick={() => this.togglePublish()}
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
                      <td colSpan="2">
                        <h5 className="mx-0">
                          <span className="blue-color">
                            {model.name || "Unknown"}
                          </span>
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
                      </td>
                    </tr>
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
                        <h6 className="blue-color">Performance</h6>
                        <Container>
                          <Row className="mt-4">
                            <Col sm="5" className="mb-2 ">
                              Overall Accuracy
                            </Col>
                            <Col sm="7">{model.overall_perf}%</Col>
                          </Row>
                          {orderedScores.map((data) => {
                            return (
                              <Row key={data.round_id}>
                                <Col sm="5" className="row-wise">
                                  Round {data.round_id}
                                </Col>
                                <Col sm="7">
                                  {Math.round(data.accuracy).toFixed(2)}%
                                </Col>
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
