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
  Spinner,
  DropdownButton,
  Dropdown,
} from "react-bootstrap";
import Moment from "react-moment";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import UserContext from "./UserContext";
import "./ModelPage.css";
import {
  DeploymentStatus,
  EvaluationStatus,
  AnonymousStatus,
} from "./ModelStatus";
import { OverlayProvider, BadgeOverlay } from "./Overlay";
import { useState } from "react";
import FloresGrid from "../components/FloresComponents/FloresGrid";
import ChevronExpandButton from "../components/Buttons/ChevronExpandButton";
import { FLORES_TASK_CODES } from "./FloresTaskPage";

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
            <br />
            {score.dataset_source_url && score.dataset_source_url !== "" ? (
              <Button href={score.dataset_source_url}>
                <i className="fas fa-newspaper"></i> Read Paper
              </Button>
            ) : (
              ""
            )}
          </Modal.Body>
        </Modal>
        <tr key={score.dataset_name}>
          <td>
            <span
              onClick={() => setShowModal(!showModal)}
              className="btn-link dataset-link"
            >
              {expanded ? <b>{score.dataset_name}</b> : score.dataset_name}
            </span>{" "}
            {clickable ? (
              <div
                style={{ float: "right" }}
                onClick={() => (clickable ? setExpanded(!expanded) : "")}
              >
                <ChevronExpandButton
                  expanded={expanded}
                  containerClassName={"position-absolute start-100"}
                />
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
          perf_by_tag.map((perf_and_tag, index) => {
            return (
              <tr key={index} style={{ border: `none` }}>
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
        username: "",
      },
      taskCode: null,
      task: {},
      isLoading: false,
    };
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    const user = this.context.api.getCredentials();
    this.setState({ ctxUserId: user.id });
    this.fetchModel();
  }

  fetchModel = () => {
    this.context.api.getModel(this.state.modelId).then(
      (result) => {
        this.setState({ model: result, isLoading: false }, function () {
          this.context.api.getTask(this.state.model.tid).then(
            (result) => {
              this.setState({
                taskCode: result.task_code,
                task: result,
              });
              const taskCodeFromParams = this.props.match.params.taskCode;
              if (
                taskCodeFromParams &&
                taskCodeFromParams !== result.task_code
              ) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${taskCodeFromParams}`,
                    `/tasks/${result.task_code}`
                  ),
                  search: this.props.location.search,
                });
              }
            },
            (error) => {
              console.log(error);
            }
          );
        });
      },
      (error) => {
        console.log(error);
        this.setState({ isLoading: false });
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
      }
    );
  };

  handleEdit = () => {
    this.props.history.push({
      pathname: `/tasks/${this.state.taskCode}/models/${this.state.model.id}/updateModelInfo`,
      state: { detail: this.state.model },
    });
  };

  handleInteract = () => {
    this.props.history.push({
      pathname: `/tasks/${this.state.taskCode}/create`,
      state: {
        detail: {
          endpointUrl:
            `https://obws766r82.execute-api.${this.state.task.aws_region}.amazonaws.com/predict?model=` +
            this.state.model.endpoint_name,
          name: this.state.model.name,
        },
      },
    });
  };

  togglePublish = () => {
    const modelName = this.state.model.name;
    if (!modelName || modelName === "") {
      this.props.history.push({
        pathname: `/tasks/${this.state.taskCode}/models/${this.state.model.id}/updateModelInfo`,
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
    if (propState && propState.src === "updateModelInfo") {
      this.props.history.push("/account#models");
    } else {
      this.props.history.goBack();
    }
  };

  escapeLatexCharacters = (strToEscape) => {
    const escapes = {
      "{": "\\{",
      "}": "\\}",
      "#": "\\#",
      $: "\\$",
      "%": "\\%",
      "&": "\\&",
      "^": "\\textasciicircum{}",
      _: "\\_",
      "~": "\\textasciitilde{}",
      "\\": "\\textbackslash{}",
    };
    const regex = new RegExp(`[${Object.keys(escapes).join("")}\\]`);
    return strToEscape.replace(regex, (match) => escapes[match]);
  };

  processScoresArrayForLatex = (scoresArr) => {
    let tableContentForScores = "";
    scoresArr = (scoresArr || []).sort((a, b) => b.accuracy - a.accuracy);
    scoresArr.forEach((score) => {
      tableContentForScores += `        ${this.escapeLatexCharacters(
        score.dataset_name
      )} & ${score.accuracy} \\\\\n`;
    });
    return tableContentForScores;
  };

  downloadLatex = () => {
    let { leaderboard_scores, non_leaderboard_scores, name } = this.state.model;
    const { task } = this.state;
    const taskName = task.name;

    let latexTableContent = "";

    latexTableContent += this.processScoresArrayForLatex(leaderboard_scores);
    latexTableContent += this.processScoresArrayForLatex(
      non_leaderboard_scores
    );

    const modelUrl = window.location.href;

    let latexDocStr = `\\documentclass{article}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\begin{document}

\\begin{table}[]
    \\centering
    \\begin{tabular}{l|r}
        \\toprule
        \\textbf{Dataset} & \\textbf{${this.escapeLatexCharacters(
          task.perf_metric_field_name
        )}} \\\\
        \\midrule
${latexTableContent}
        \\bottomrule
    \\end{tabular}
    \\caption{${this.escapeLatexCharacters(
      taskName
    )} results: \\url{${modelUrl}}}
    \\label{tab:results}
\\end{table}

\\end{document}`;

    const latexContent =
      "data:application/x-latex;charset=utf-8," + latexDocStr;

    const encodedUri = encodeURI(latexContent);
    const csvLink = document.createElement("a");
    csvLink.setAttribute("href", encodedUri);
    csvLink.setAttribute("download", name + "-" + taskName + ".tex");
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
  };

  processScoresArrayForCsv = (csvRows, scoresArr, datasetType) => {
    scoresArr = (scoresArr || []).sort((a, b) => b.accuracy - a.accuracy);
    scoresArr.forEach((score) => {
      csvRows.push([score.dataset_name, datasetType, score.accuracy]);
    });
  };

  downloadCsv = () => {
    const { leaderboard_scores, non_leaderboard_scores, name } =
      this.state.model;
    const { task } = this.state;
    const taskName = task.name;

    const rows = [];
    rows.push(["dataset-name", "dataset-type", task.perf_metric_field_name]);
    this.processScoresArrayForCsv(rows, leaderboard_scores, "leaderboard");
    this.processScoresArrayForCsv(
      rows,
      non_leaderboard_scores,
      "non-leaderboard"
    );

    let csvContent = "data:text/csv;charset=utf-8,";

    rows.forEach((rowArray) => {
      csvContent += rowArray.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const csvLink = document.createElement("a");
    csvLink.setAttribute("href", encodedUri);
    csvLink.setAttribute("download", name + "-" + taskName + ".csv");
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
  };

  render() {
    const { model, task, taskCode } = this.state;
    const isFlores = FLORES_TASK_CODES.includes(task.task_code);
    const isModelOwner =
      parseInt(this.state.model.user_id) === parseInt(this.state.ctxUserId);
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
                    {(isModelOwner || model.is_published) &&
                    model.deployment_status === "deployed" ? (
                      <Button
                        variant="outline-primary mr-2"
                        onClick={() => this.handleInteract()}
                      >
                        <i className="fas fa-pen"></i> Interact
                      </Button>
                    ) : (
                      ""
                    )}
                    {model.source_url && model.source_url !== "" ? (
                      <Button
                        variant="outline-primary mr-2"
                        href={model.source_url}
                      >
                        <i className="fas fa-newspaper"></i> Read Paper
                      </Button>
                    ) : (
                      ""
                    )}
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
                              <span>{model.name || "Unknown"}</span>
                              <span className="float-right">
                                uploaded{" "}
                                <Moment utc fromNow>
                                  {model.upload_datetime}
                                </Moment>
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
                    <Table hover responsive className="mb-0">
                      <thead />
                      <tbody>
                        {isModelOwner && (
                          <tr style={{ border: `none` }} class="border-bottom">
                            <td>Owner Anonymity</td>
                            <td>
                              <AnonymousStatus
                                anonymousStatus={model.is_anonymous}
                              />
                            </td>
                          </tr>
                        )}
                        <tr style={{ border: `none` }}>
                          <td>Deployment Status</td>
                          <td>
                            <DeploymentStatus
                              deploymentStatus={model.deployment_status}
                            />
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>Evaluation Status</td>
                          <td>
                            <EvaluationStatus
                              evaluationStatus={model.evaluation_status}
                            />
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td>Owner</td>
                          <td>
                            {model.is_anonymous ? (
                              "anonymous"
                            ) : (
                              <Link to={`/users/${model.user_id}`}>
                                {model.username}
                              </Link>
                            )}
                          </td>
                        </tr>
                        {!isFlores && (
                          <tr style={{ border: `none` }}>
                            <td>Task</td>
                            <td>
                              <Link to={`/tasks/${taskCode}`}>{taskCode}</Link>
                            </td>
                          </tr>
                        )}
                        <tr style={{ border: `none` }}>
                          <td>Summary</td>
                          <td>{model.longdesc}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td style={{ whiteSpace: "nowrap" }}># Parameters</td>
                          <td>{model.params}</td>
                        </tr>
                        {!isFlores && (
                          <tr style={{ border: `none` }}>
                            <td>Language(s)</td>
                            <td>{model.languages}</td>
                          </tr>
                        )}
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
                    <span className={"w-100 mt-5 mx-4"}>
                      <DropdownButton
                        alignRight={true}
                        variant="outline-primary"
                        className="mr-2 float-right"
                        title={"Export"}
                      >
                        <Dropdown.Item onClick={this.downloadCsv}>
                          {"CSV"}
                        </Dropdown.Item>
                        <Dropdown.Item onClick={this.downloadLatex}>
                          {"LaTeX"}
                        </Dropdown.Item>
                      </DropdownButton>
                    </span>
                    <Table>
                      <tbody>
                        <tr>
                          <td colSpan={2}>
                            <h5>Leaderboard Datasets</h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    {orderedLeaderboardScores.map((score, index) => (
                      <ScoreRow key={index} score={score} />
                    ))}
                    <Table>
                      <tbody>
                        <tr>
                          <td colSpan={2}>
                            <h5>Non-Leaderboard Datasets</h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    {orderedNonLeaderboardScores.map((score, index) => (
                      <ScoreRow score={score} key={index} />
                    ))}
                  </InputGroup>
                ) : (
                  <Container>
                    <Row>
                      <Col className="my-4 text-center">Loading</Col>
                    </Row>
                    <Row>
                      <Col className="mb-4 text-center">
                        {this.state.isLoading && <Spinner animation="border" />}
                      </Col>
                    </Row>
                  </Container>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Container>
        {isFlores && (
          <>
            <Container>
              <hr />
            </Container>
            <FloresGrid model={model} />
          </>
        )}
      </OverlayProvider>
    );
  }
}

export default ModelPage;
