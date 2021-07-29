/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./TaskPage.css";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ButtonGroup,
  Nav,
  Table,
  Tooltip,
  OverlayTrigger,
  Pagination,
  DropdownButton,
  Dropdown,
  Modal,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Formik } from "formik";
import UserContext from "./UserContext";
import { LineRechart } from "../components/Rechart";
import { Avatar } from "../components/Avatar/Avatar";
import Moment from "react-moment";
import DragAndDrop from "../components/DragAndDrop/DragAndDrop";
import { OverlayProvider, Annotation, OverlayContext } from "./Overlay";
import {
  TaskModelDefaultLeaderboard,
  TaskModelForkLeaderboard,
  TaskModelSnapshotLeaderboard,
} from "../components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";

const chartSizes = {
  xs: { fontSize: 10 },
  sm: {
    fontSize: 14,
    height: 300,
    left: -30,
    xAxisLeftPadding: 30,
  },
  md: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 30,
  },
  lg: {
    align: "center",
    fontSize: 14,
    height: 302,
    left: -20,
    xAxisLeftPadding: 50,
  },
  xl: {
    fontSize: 14,
    height: 300,
    left: -20,
    xAxisLeftPadding: 50,
  },
};

const TaskTrend = ({ data }) => {
  return (
    <>
      <Card className="my-4">
        <Card.Header className="p-3 light-gray-bg">
          <h2 className="text-uppercase m-0 text-reset">
            Model Performance vs. Round{" "}
          </h2>
        </Card.Header>
        <Card.Body className="px-1 py-5">
          {/* Mobile / Tablet / Desktop charts */}
          <Col xs={12} className="d-block d-sm-none">
            <LineRechart size={chartSizes.xs} data={data} />
          </Col>
          <Col sm={12} className="d-none d-sm-block d-md-none">
            <LineRechart size={chartSizes.sm} data={data} />
          </Col>
          <Col md={12} className="d-none d-md-block d-lg-none">
            <LineRechart size={chartSizes.md} data={data} />
          </Col>
          <Col lg={12} className="d-none d-lg-block d-xl-none">
            <LineRechart size={chartSizes.lg} data={data} />
          </Col>
          <Col xl={12} className="d-none d-xl-block">
            <LineRechart size={chartSizes.xl} data={data} />
          </Col>
        </Card.Body>
      </Card>
    </>
  );
};

const TaskActionButtons = (props) => {
  function renderTooltip(props, text) {
    return (
      <Tooltip id="button-tooltip" {...props}>
        {text}
      </Tooltip>
    );
  }

  function renderCreateTooltip(props) {
    return renderTooltip(props, "Create new examples where the model fails");
  }
  function renderVerifyTooltip(props) {
    return renderTooltip(
      props,
      "Verify examples where the model may have failed"
    );
  }
  function renderSubmitTooltip(props) {
    return renderTooltip(props, "Submit models for this task");
  }

  return (
    <Nav className="my-4">
      <Nav.Item className="task-action-btn">
        <Annotation
          placement="bottom"
          tooltip="Click here to get creative and start writing examples that fool the model"
        >
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 250, hide: 400 }}
            overlay={renderCreateTooltip}
          >
            <Button
              as={Link}
              className="border-0 blue-color font-weight-bold light-gray-bg"
              to={`/tasks/${props.taskCode}/create`}
            >
              <i className="fas fa-pen"></i> Create Examples
            </Button>
          </OverlayTrigger>
        </Annotation>
      </Nav.Item>
      <Nav.Item className="task-action-btn">
        <Annotation
          placement="top"
          tooltip="Click here to see examples created by others, and validate their correctness"
        >
          <OverlayTrigger
            placement="bottom"
            delay={{ show: 250, hide: 400 }}
            overlay={renderVerifyTooltip}
          >
            <Button
              as={Link}
              className="border-0 blue-color font-weight-bold light-gray-bg"
              to={`/tasks/${props.taskCode}/validate`}
            >
              <i className="fas fa-search"></i> Validate Examples
            </Button>
          </OverlayTrigger>
        </Annotation>
      </Nav.Item>
      {props.task.shortname === "NLI" ||
      props.task.shortname === "QA" ||
      props.task.shortname === "Hate Speech" ||
      props.task.shortname === "Sentiment" ? (
        <Nav.Item className="task-action-btn">
          <Annotation
            placement="right"
            tooltip="Click here to upload your models for this task."
          >
            <OverlayTrigger
              placement="bottom"
              delay={{ show: 250, hide: 400 }}
              overlay={renderSubmitTooltip}
            >
              <Button
                className="border-0 blue-color font-weight-bold light-gray-bg"
                href="https://github.com/facebookresearch/dynalab"
                target="_blank"
              >
                <i className="fas fa-upload"></i> Submit Models
              </Button>
            </OverlayTrigger>
          </Annotation>
        </Nav.Item>
      ) : null}
    </Nav>
  );
};

const OverallTaskStats = (props) => {
  return (
    <Table className="w-50 font-weight-bold ml-n2">
      <thead />
      <tbody>
        <tr>
          <td>Current round:</td>
          <td className="text-right">{props.task.cur_round}</td>
        </tr>
        <tr>
          <td>Fooled/Collected (Model Error rate)</td>
          <td className="text-right">
            {props.task.round?.total_fooled}/{props.task.round?.total_collected}{" "}
            (
            {props.task.round?.total_collected > 0
              ? (
                  (100 * props.task.round?.total_fooled) /
                  props.task.round?.total_collected
                ).toFixed(2)
              : "0.00"}
            % )
          </td>
        </tr>
        {props.task.round && (
          <tr>
            <td>Verified Fooled/Collected (Verified Model Error Rate)</td>
            <td className="text-right">
              {props.task.round?.total_verified_fooled}/
              {props.task.round?.total_collected} (
              {props.task.round?.total_collected > 0
                ? (
                    (100 * props.task.round?.total_verified_fooled) /
                    props.task.round?.total_collected
                  ).toFixed(2)
                : "0.00"}
              % )
            </td>
          </tr>
        )}
        <tr>
          <td>Last activity:</td>
          <td className="text-right">
            <Moment utc fromNow>
              {props.task.last_updated}
            </Moment>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

const UserLeaderBoard = (props) => {
  const rounds = (props.round && props.cur_round) || 0;
  const roundNavs = [];
  for (let i = rounds; i >= 0; i--) {
    let cur = "";
    let active = false;
    if (i === props.cur_round) {
      cur = " (active)";
    }
    const dropDownRound = i === 0 ? "overall" : i;
    if (dropDownRound === props.displayRound) {
      active = true;
    }
    roundNavs.push(
      <Dropdown.Item
        key={dropDownRound}
        index={dropDownRound}
        onClick={() => props.fetchOverallUserLeaderboard(0, dropDownRound)}
        active={active}
      >
        {dropDownRound === "overall" ? "Overall" : "Round " + dropDownRound}
        {cur}
      </Dropdown.Item>
    );
    if (i === props.cur_round) {
      roundNavs.push(<Dropdown.Divider key={"div" + i} />);
    }
  }
  return (
    <Annotation
      placement="left"
      tooltip="This shows how well our users did on this task. This does not include non-Dynabench users such as Mechanical Turkers."
    >
      <Card className="my-4">
        <Card.Header className="light-gray-bg d-flex align-items-center">
          <h2 className="text-uppercase m-0 text-reset">User Leaderboard</h2>
          <div className="d-flex justify-content-end flex-fill">
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="tip-user-round-selection">Switch Round</Tooltip>
              }
            >
              <DropdownButton
                variant="light"
                className="border-0 blue-color font-weight-bold light-gray-bg"
                style={{ marginRight: 10 }}
                id="dropdown-basic-button"
                title={
                  props.displayRound === "overall"
                    ? "Overall"
                    : "Round " +
                      props.displayRound +
                      (props.cur_round === props.displayRound
                        ? " (active)"
                        : "")
                }
              >
                {roundNavs}
              </DropdownButton>
            </OverlayTrigger>
          </div>
        </Card.Header>
        <Table hover className="mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th className="text-right">Verified MER</th>
              <th className="text-right pr-4">Totals</th>
            </tr>
          </thead>
          <tbody>
            {props.data.map((data) => {
              return (
                <tr key={data.uid}>
                  <td>
                    <Avatar
                      avatar_url={data.avatar_url}
                      username={data.username}
                      isThumbnail={true}
                      theme="blue"
                    />
                    <Link
                      to={`/users/${data.uid}#profile`}
                      className="btn-link"
                    >
                      {data.username}
                    </Link>
                  </td>
                  <td className="text-right">{data.MER}%</td>
                  <td className="text-right pr-4">{data.total}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item
              disabled={!props.userLeaderBoardPage}
              onClick={() => props.paginate("previous", props.displayRound)}
            >
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={props.isEndOfUserLeaderPage}
              onClick={() => props.paginate("next", props.displayRound)}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Annotation>
  );
};

class RoundDescription extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.getRoundInfo = this.getRoundInfo.bind(this);
  }
  componentDidMount() {
    this.getRoundInfo();
  }
  getRoundInfo() {
    if (this.props.round_id) {
      this.props.api.getTaskRound(this.props.task_id, this.props.round_id).then(
        (result) => {
          this.setState({ round: result });
        },
        (error) => {
          console.log(error);
          if (
            (error.status_code === 404 || error.status_code === 405) &&
            this.props.history
          ) {
            this.props.history.push("/");
          }
        }
      );
    }
  }
  componentDidUpdate(prevProps) {
    if (
      prevProps.task_id !== this.props.task_id ||
      prevProps.round_id !== this.props.round_id
    ) {
      this.getRoundInfo();
    }
  }
  render() {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: this.state.round?.longdesc }}
      ></div>
    );
  }
}

class TaskPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskCode: props.match.params.taskCode,
      task: {},
      trendScore: [],
      userLeaderBoardData: [],
      userLeaderBoardPage: 0,
      isEndOfUserLeaderPage: true,
      pageLimit: 7,
      validateNonFooling: false,
      numMatchingValidations: 3,
    };

    this.exportAllTaskData = this.exportAllTaskData.bind(this);
    this.getSavedTaskSettings = this.getSavedTaskSettings.bind(this);
    this.exportCurrentRoundData = this.exportCurrentRoundData.bind(this);
    this.getCurrentTaskData = this.getCurrentTaskData.bind(this);
  }

  getCurrentTaskData() {
    this.setState({ taskCode: this.props.match.params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          this.setState(
            {
              taskCode: result.task_code,
              task: result,
              displayRound: "overall",
              round: result.round,
            },
            function () {
              if (this.props.match.params.taskCode !== this.state.taskCode) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${this.props.match.params.taskCode}`,
                    `/tasks/${this.state.taskCode}`
                  ),
                  search: this.props.location.search,
                });
              }
              this.refreshData();
            }
          );
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        }
      );
    });
  }

  componentDidMount() {
    this.getCurrentTaskData();
  }

  componentDidUpdate(prevProps) {
    if (this.props.match.params.taskCode !== this.state.taskCode) {
      this.getCurrentTaskData();
    }
  }

  getSavedTaskSettings() {
    if (this.state.task.settings_json) {
      const settings_json = JSON.parse(this.state.task.settings_json);
      this.setState({
        validateNonFooling: settings_json.hasOwnProperty("validate_non_fooling")
          ? settings_json["validate_non_fooling"]
          : false,
      });
      this.setState({
        numMatchingValidations: settings_json.hasOwnProperty(
          "num_matching_validations"
        )
          ? settings_json["num_matching_validations"]
          : 3,
      });
    } else {
      this.setState({
        validateNonFooling: false,
        numMatchingValidations: 3,
      });
    }
  }

  refreshData() {
    this.setState(
      {
        userLeaderBoardPage: 0,
        isEndOfUserLeaderPage: true,
        displayRound: "overall",
      },
      () => {
        this.fetchOverallUserLeaderboard(
          this.state.userLeaderBoardPage,
          this.state.displayRound
        );
        this.getSavedTaskSettings();
        this.fetchTrend();
      }
    );
  }

  exportAllTaskData() {
    return this.context.api.exportData(this.state.task.id);
  }

  exportCurrentRoundData() {
    return this.context.api.exportData(
      this.state.task.id,
      this.state.task.cur_round
    );
  }

  fetchTrend() {
    this.context.api.getTrends(this.state.task.id).then(
      (result) => {
        this.setState({
          trendScore: result,
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  fetchOverallUserLeaderboard = (page, displayRound) => {
    this.context.api
      .getOverallUserLeaderboard(
        this.state.task.id,
        displayRound,
        this.state.pageLimit,
        page
      )
      .then(
        (result) => {
          const isEndOfPage = (page + 1) * this.state.pageLimit >= result.count;
          this.setState({
            isEndOfUserLeaderPage: isEndOfPage,
            userLeaderBoardData: result.data,
            displayRound: displayRound,
            userLeaderBoardPage: page,
          });
        },
        (error) => {
          console.log(error);
        }
      );
  };

  escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  handleValidation = (values) => {
    const errors = {};
    let allowedTaskExtension = ".jsonl";
    const allowedExtensions = new RegExp(
      this.escapeRegExp(allowedTaskExtension) + "$",
      "i"
    );

    if (!values.file) {
      errors.file = "Required";
      values.result = "";
    } else if (!allowedExtensions.exec(values.file.name)) {
      errors.file =
        "Invalid file type - Please upload in " +
        allowedTaskExtension +
        " format";
      values.result = "";
    }
    return errors;
  };

  handleSubmit = (values, { setFieldValue, setSubmitting }) => {
    const reqObj = {
      taskId: this.state.task.id,
      file: values.file,
    };
    this.context.api.submitContexts(reqObj).then(
      (result) => {
        setSubmitting(false);
        setFieldValue("file", null, false);
        setFieldValue("result", "Submitted!", false);
      },
      (error) => {
        setSubmitting(false);
        setFieldValue("result", "Failed To Submit. Plese try again");
        console.log(error);
      }
    );
  };

  userLeaderBoardPaginate = (state, round) => {
    const page =
      state === "next"
        ? this.state.userLeaderBoardPage + 1
        : this.state.userLeaderBoardPage - 1;
    this.fetchOverallUserLeaderboard(page, round);
  };

  render() {
    const pwc_logo = (
      <svg height="30" width="30" viewBox="0 0 512 512">
        <path
          fill="#21cbce"
          d="M88 128h48v256H88zm144 0h48v256h-48zm-72 16h48v224h-48zm144 0h48v224h-48zm72-16h48v256h-48z"
        ></path>
        <path
          fill="#21cbce"
          d="M104 104V56H16v400h88v-48H64V104zm304-48v48h40v304h-40v48h88V56z"
        ></path>
      </svg>
    );
    const shortname_to_pwc_links = {
      QA: "https://paperswithcode.com/task/question-answering/latest",
      NLI: "https://paperswithcode.com/task/natural-language-inference/latest",
      "Hate Speech":
        "https://paperswithcode.com/task/hate-speech-detection/latest",
      Sentiment: "https://paperswithcode.com/task/sentiment-analysis/latest",
    };
    return (
      <OverlayProvider initiallyHide={true} delayMs="1700">
        <Container>
          <Row>
            <Col />
            <Col className="text-center">
              <h2 className="task-page-header text-reset">
                <nobr>
                  {this.state.task.name}{" "}
                  {this.state.task.shortname in shortname_to_pwc_links ? (
                    <a href={shortname_to_pwc_links[this.state.task.shortname]}>
                      {pwc_logo}
                    </a>
                  ) : (
                    ""
                  )}
                </nobr>
              </h2>
            </Col>
            <Col>
              <div style={{ float: "right", marginTop: 30 }}>
                <ButtonGroup>
                  <Annotation
                    placement="left"
                    tooltip="Click to show help overlay"
                  >
                    <OverlayContext.Consumer>
                      {({ hidden, setHidden }) => (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm btn-help-info"
                          onClick={() => {
                            setHidden(!hidden);
                          }}
                        >
                          <i className="fas fa-question"></i>
                        </button>
                      )}
                    </OverlayContext.Consumer>
                  </Annotation>
                  {this.context.api.isTaskOwner(
                    this.context.user,
                    this.state.task.id
                  ) || this.context.user.admin ? (
                    <Annotation
                      placement="top"
                      tooltip="Click to adjust your owner task settings"
                    >
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-help-info"
                        onClick={() => {
                          this.setState({ showTaskOwnerSettingsModal: true });
                        }}
                      >
                        <i className="fa fa-cog"></i>
                      </button>
                    </Annotation>
                  ) : (
                    ""
                  )}
                </ButtonGroup>
                <Modal
                  show={this.state.showTaskOwnerSettingsModal}
                  onHide={() =>
                    this.setState({ showTaskOwnerSettingsModal: false })
                  }
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Task Owner Console</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Modal.Title style={{ fontSize: 20 }}>Settings</Modal.Title>
                    <hr />
                    Validate non-model-fooling examples? &nbsp;
                    <span className="float-right">
                      <Form.Check
                        checked={this.state.validateNonFooling}
                        onChange={() => {
                          this.setState(
                            {
                              validateNonFooling:
                                !this.state.validateNonFooling,
                            },
                            () =>
                              this.context.api.updateTaskSettings(
                                this.state.task.id,
                                {
                                  validate_non_fooling:
                                    this.state.validateNonFooling,
                                  num_matching_validations:
                                    this.state.numMatchingValidations,
                                }
                              )
                          );
                        }}
                      />
                    </span>
                    <hr />
                    Number of correct, incorrect, <br /> or flagged marks when
                    an example
                    <span className="float-right">
                      {this.state.numMatchingValidations}
                      <span className="float-right">
                        <Form.Control
                          className="p-1"
                          type="range"
                          min="1"
                          max="10"
                          step="1"
                          defaultValue={this.state.numMatchingValidations}
                          onChange={(e) => {
                            this.setState(
                              {
                                numMatchingValidations: parseInt(
                                  e.target.value
                                ),
                              },
                              () =>
                                this.context.api.updateTaskSettings(
                                  this.state.task.id,
                                  {
                                    validate_non_fooling:
                                      this.state.validateNonFooling,
                                    num_matching_validations:
                                      this.state.numMatchingValidations,
                                  }
                                )
                            );
                          }}
                        />
                      </span>
                    </span>
                    <br /> is no longer shown to validators?
                    <hr />
                    <Modal.Title style={{ fontSize: 20 }}>Actions</Modal.Title>
                    <hr />
                    <span className="float-right">
                      <DropdownButton
                        className="border-0 blue-color font-weight-bold p-1"
                        id="dropdown-basic-button"
                        title="Export Data"
                      >
                        <Dropdown.Item onClick={this.exportCurrentRoundData}>
                          Export current round
                        </Dropdown.Item>
                        <Dropdown.Item onClick={this.exportAllTaskData}>
                          Export all
                        </Dropdown.Item>
                      </DropdownButton>
                    </span>
                    Click here to export data from the <br />
                    current round or all rounds
                    <hr />
                    Add new contexts to the current round by uploading them
                    here, as a jsonl where each datum has three fields: <br />{" "}
                    <br />
                    <b>text</b>: a string representation of the context <br />
                    <b>tag</b>: a string that associates this context with a set
                    of other contexts <br />
                    <b>metadata</b>: a dictionary in json format representing
                    any other data that is useful to you <br /> <br />
                    <Formik
                      initialValues={{
                        file: null,
                        result: "",
                      }}
                      validate={this.handleValidation}
                      onSubmit={this.handleSubmit}
                    >
                      {({
                        values,
                        errors,
                        handleChange,
                        setFieldValue,
                        handleSubmit,
                        isSubmitting,
                        setValues,
                      }) => (
                        <form
                          onSubmit={handleSubmit}
                          encType="multipart/form-data"
                        >
                          <Container>
                            <Form.Group>
                              {values.file ? (
                                <div className="UploadResult">
                                  <Card>
                                    <Card.Body>
                                      <Container>
                                        <Row>
                                          <Col md={10}>{values.file.name}</Col>
                                          <Col md={2}>
                                            <Button
                                              variant="outline-danger"
                                              size="sm"
                                              onClick={(event) => {
                                                setFieldValue("result", "");
                                                setFieldValue("file", null);
                                              }}
                                            >
                                              Delete
                                            </Button>
                                          </Col>
                                        </Row>
                                      </Container>
                                    </Card.Body>
                                  </Card>
                                </div>
                              ) : (
                                <DragAndDrop
                                  handleChange={(event) => {
                                    setValues({
                                      ...values,
                                      file: event.currentTarget.files[0],
                                      result: "",
                                    });
                                  }}
                                  required={errors.file}
                                  name="file"
                                >
                                  Drag
                                </DragAndDrop>
                              )}
                              <small className="form-text text-muted">
                                {errors.file}
                                {values.result}
                              </small>
                              <InputGroup>
                                <Button
                                  type="submit"
                                  variant="primary"
                                  className="fadeIn third submitBtn button-ellipse"
                                  disabled={isSubmitting}
                                >
                                  Upload Contexts
                                </Button>
                              </InputGroup>
                            </Form.Group>
                          </Container>
                        </form>
                      )}
                    </Formik>
                  </Modal.Body>
                </Modal>
              </div>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <p>{this.state.task.desc}</p>
          </Row>
          <Row className="justify-content-center">
            <Annotation
              placement="right"
              tooltip="This shows the statistics of the currently active round."
            >
              <OverallTaskStats task={this.state.task} />
            </Annotation>
          </Row>
          <Row className="justify-content-center">
            <TaskActionButtons
              api={this.context.api}
              taskCode={this.state.taskCode}
              user={this.context.user}
              task={this.state.task}
            />
          </Row>
          <Row className="justify-content-center">
            <Col xs={12} md={12}>
              <RoundDescription
                api={this.context.api}
                task_id={this.state.task.id}
                cur_round={this.state.task.cur_round}
                round_id={this.state.task.cur_round}
              />
            </Col>
          </Row>
          {this.state.task && this.state.task.ordered_scoring_datasets && (
            <Row className="justify-content-center">
              <Col xs={12} md={12}>
                <Annotation
                  placement="left"
                  tooltip="This shows how models have performed on this task - the top-performing models are the ones we’ll use for the next round"
                >
                  {this.props.match.params.leaderboardName ? (
                    <TaskModelForkLeaderboard
                      {...this.props}
                      task={this.state.task}
                      taskCode={this.state.taskCode}
                    />
                  ) : this.props.match.params.snapshotName ? (
                    <TaskModelSnapshotLeaderboard
                      {...this.props}
                      task={this.state.task}
                      taskCode={this.state.taskCode}
                      disableToggleSort={true}
                      disableAdjustWeights={true}
                      disableForkAndSnapshot={true}
                    />
                  ) : (
                    <TaskModelDefaultLeaderboard
                      {...this.props}
                      task={this.state.task}
                      taskCode={this.state.taskCode}
                    />
                  )}
                </Annotation>
              </Col>
            </Row>
          )}
          <Row>
            <Col xs={12} md={6}>
              <UserLeaderBoard
                fetchOverallUserLeaderboard={this.fetchOverallUserLeaderboard}
                round={this.state.task.round}
                cur_round={this.state.task.cur_round}
                data={this.state.userLeaderBoardData}
                paginate={this.userLeaderBoardPaginate}
                displayRound={this.state.displayRound}
                isEndOfUserLeaderPage={this.state.isEndOfUserLeaderPage}
                userLeaderBoardPage={this.state.userLeaderBoardPage}
              />
            </Col>
            <Col xs={12} md={6}>
              {this.state.trendScore.length ? (
                <Annotation
                  placement="top-end"
                  tooltip="As tasks progress over time, we can follow their trend, which is shown here"
                >
                  <TaskTrend data={this.state.trendScore} />
                </Annotation>
              ) : null}
            </Col>
          </Row>
        </Container>
      </OverlayProvider>
    );
  }
}

export default TaskPage;
