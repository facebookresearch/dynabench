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
  InputGroup,
  Modal,
} from "react-bootstrap";
import Moment from "react-moment";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import "./ModelPage.css";
import { OverlayProvider, BadgeOverlay } from "./Overlay";
import { useState } from "react";

const ChevronExpandButton = ({ expanded }) => {
  return (
    <a type="button" className="position-absolute start-100">
      {expanded ? (
        <i className="fas fa-chevron-down"></i>
      ) : (
        <i className="fas fa-chevron-right"></i>
      )}
    </a>
  );
};

const ScoreRow = ({ score }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const perf_by_tag =
    score.metadata_json &&
    JSON.parse(score.metadata_json).hasOwnProperty("perf_by_tag")
      ? JSON.parse(score.metadata_json)["perf_by_tag"]
      : [];

  const clickable = perf_by_tag.length !== 0;

  return (
    <Table hover className="mb-0 hover" style={{ tableLayout: "fixed" }}>
      <tbody>
        <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
          <Modal.Header closeButton>
            <Modal.Title>{score.dataset_name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {score.dataset_longdesc}
            <br />
            <a href={score.dataset_source_url}>{score.dataset_source_url}</a>
          </Modal.Body>
        </Modal>
        <tr key={score.dataset_name}>
          <td>
            <a type="button" onClick={() => setShowModal(!showModal)}>
              {expanded ? <b>{score.dataset_name}</b> : score.dataset_name}
            </a>
            {clickable ? (
              <div
                style={{ float: "right" }}
                onClick={() => (clickable ? setExpanded(!expanded) : "")}
              >
                <ChevronExpandButton expanded={expanded} />
              </div>
            ) : (
              ""
            )}
          </td>
          <td
            className="text-right t-2"
            key={`score-${score.dataset_name}-overall`}
            onClick={() => (clickable ? setExpanded(!expanded) : "")}
          >
            <span>
              {expanded ? (
                <b>{parseFloat(score.accuracy).toFixed(2)}</b>
              ) : (
                parseFloat(score.accuracy).toFixed(2)
              )}
            </span>
          </td>
        </tr>
        {expanded &&
          perf_by_tag.map((perf_and_tag) => {
            return (
              <tr style={{ border: `none` }}>
                <td className="text-right pr-4  text-nowrap">
                  <div className="d-flex justify-content-end align-items-center">
                    <span className="d-flex align-items-center">
                      {perf_and_tag.tag}&nbsp;
                    </span>
                  </div>
                </td>
                <td
                  className="text-right "
                  key={`score-${score.dataset_name}-${perf_and_tag.tag}-overall`}
                >
                  <span>{parseFloat(perf_and_tag.perf).toFixed(2)}</span>
                </td>
              </tr>
            );
          })}
      </tbody>
    </Table>
  );
};

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
      },
    };
  }

  componentDidMount() {
    const user = this.context.api.getCredentials();
    this.setState({ ctxUserId: user.id });
    this.fetchModel();
  }

  fetchModel = () => {
    this.context.api.getModel(this.state.modelId).then(
      (result) => {
        this.setState({ model: result });
      },
      (error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
      }
    );
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
    return this.context.api.toggleModelStatus(this.state.modelId).then(
      (result) => {
        if (!!result.badges) {
          this.setState({ showBadges: result.badges });
        }
        this.fetchModel();
      },
      (error) => {
        console.log(error);
      }
    );
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
    const { leaderboard_scores } = this.state.model;
    const { non_leaderboard_scores } = this.state.model;
    let orderedLeaderboardScores = (leaderboard_scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );
    let orderedNonLeaderboardScores = (non_leaderboard_scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );
    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <Container className="mb-5 pb-5">
          <h1 className="my-4 pt-3 text-uppercase text-center">
            Model Overview
          </h1>
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
                  <InputGroup>
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
                                uploaded{" "}
                                <Moment fromNow>{model.upload_datetime}</Moment>
                              </span>
                              {isModelOwner && model.is_published === "True" ? (
                                <Badge variant="success" className="ml-2">
                                  Published
                                </Badge>
                              ) : null}
                              {isModelOwner &&
                              model.is_published === "False" ? (
                                <Badge variant="danger" className="ml-2">
                                  Unpublished
                                </Badge>
                              ) : null}
                            </h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Table>
                      <tr style={{ border: `none` }}>
                        <td colSpan={2}>
                          <h6 className="blue-color">Model Information</h6>
                        </td>
                      </tr>
                    </Table>
                    <Table hover className="mb-0">
                      <thead />
                      <tbody>
                        <tr style={{ border: `none` }}>
                          <td>Owner</td>
                          <td>
                            <Link to={`/users/${model.user.id}`}>
                              {model.user && model.user.username}
                            </Link>
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>Task</td>
                          <td>
                            <Link to={`/tasks/${model.tid}#overall`}>
                              <TasksContext.Consumer>
                                {({ tasks }) => {
                                  const task =
                                    model &&
                                    tasks.filter((e) => e.id === model.tid);
                                  return (
                                    task && task.length && task[0].shortname
                                  );
                                }}
                              </TasksContext.Consumer>
                            </Link>
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>Summary</td>
                          <td>{model.longdesc}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td style={{ whiteSpace: "nowrap" }}># Parameters</td>
                          <td>{model.params}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>Language(s)</td>
                          <td>{model.languages}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>License(s)</td>
                          <td>{model.license}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td style={{ verticalAlign: "middle" }}>
                            Model Card
                          </td>
                          <td className="modelCard">
                            <Markdown>{model.model_card}</Markdown>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Table>
                      <tr>
                        <td colSpan={2}>
                          <h6 className="blue-color">Leaderboard Datasets</h6>
                        </td>
                      </tr>
                    </Table>
                    {orderedLeaderboardScores.map((score) => (
                      <ScoreRow score={score} />
                    ))}
                    <Table>
                      <tr>
                        <td colSpan={2}>
                          <h6 className="blue-color">
                            Non-Leaderboard Datasets
                          </h6>
                        </td>
                      </tr>
                    </Table>
                    {orderedNonLeaderboardScores.map((score) => (
                      <ScoreRow score={score} />
                    ))}
                  </InputGroup>
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
