/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
import Moment from "react-moment";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import "./ModelPage.css";
import {
  OverlayProvider,
  BadgeOverlay,
} from "./Overlay"

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
      }, (error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
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
      .then((result) => {
        if (!!result.badges) {
          this.setState({showBadges: result.badges})
        }
        this.fetchModel();
      }, (error) => {
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
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({showBadges: ""})}
        >
        </BadgeOverlay>
        <Container className="mb-5 pb-5">
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
                    {isModelOwner && model.is_published === true ? (
                      <Button
                        variant="outline-danger"
                        onClick={() => this.togglePublish()}
                      >
                        Unpublish
                      </Button>
                    ) : null}
                    {isModelOwner &&
                    model.is_published === false &&
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
                            <span className="float-right">
                              uploaded <Moment fromNow>{model.upload_datetime}</Moment>
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
                        <td colSpan={2}>
                          <h6 className="blue-color">Performance</h6>
                        </td>
                      </tr>
                      <tr>
                        <td style={{paddingLeft: 50}}>
                          Overall
                        </td>
                        <td>{model.overall_perf}%</td>
                      </tr>
                      {orderedScores.map((data) => {
                        return (
                          <tr key={data.round_id}>
                            <td style={{paddingLeft: 50, whiteSpace: 'nowrap'}}>Round {data.round_id}</td>
                            <td>{Number(data.accuracy).toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={2}>
                          <h6 className="blue-color">Model Information</h6>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Owner
                        </td>
                        <td>
                          <Link to={`/users/${model.user.id}`}>
                            {model.user && model.user.username}
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Task
                        </td>
                        <td>
                          <Link to={`/tasks/${model.tid}#overall`}>
                            <TasksContext.Consumer>
                              {({ tasks }) => {
                                const task =
                                  model && tasks.filter((e) => e.id == model.tid);
                                return task && task.length && task[0].shortname;
                              }}
                            </TasksContext.Consumer>
                          </Link>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          Summary
                        </td>
                        <td>{model.longdesc}</td>
                      </tr>
                      <tr>
                        <td style={{whiteSpace: 'nowrap'}}>
                          # Parameters
                        </td>
                        <td>{model.params}</td>
                      </tr>
                      <tr>
                        <td>
                          Language(s)
                        </td>
                        <td>{model.languages}</td>
                      </tr>
                      <tr>
                        <td>
                          License(s)
                        </td>
                        <td>{model.license}</td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'middle'}}>
                          Model Card
                        </td>
                        <td className="modelCard">
                          <Markdown>{model.model_card}</Markdown>
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
      </OverlayProvider>
    );
  }
}

export default ModelPage;
