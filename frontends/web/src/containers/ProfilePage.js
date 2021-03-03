/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Form,
  Col,
  Card,
  Table,
  Button,
  Nav,
  Pagination,
  Badge as BBadge,
  OverlayTrigger,
} from "react-bootstrap";
import { Formik } from "formik";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import { Avatar } from "../components/Avatar/Avatar";
import Moment from "react-moment";
import "./Sidebar-Layout.css";
import "./ProfilePage.css";
import BadgeGrid from "./BadgeGrid";
import Badge from "./Badge";
import {
  METooltip,
  RejectionTooltip,
  RetractionTooltip,
} from "./UserStatTooltips.js";

const StatsSubPage = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">
        Your Stats &amp; Badges
      </h1>
      <Col className="m-auto" lg={8}>
        <Card className="profile-card">
          <Card.Body style={{ padding: 20 }}>
            <Table className="mb-0">
              <tbody>
                <tr>
                  <td>Total examples:</td>
                  <td className="text-right">
                    {props.user.examples_submitted}
                  </td>
                </tr>
                <tr>
                  <td>Model error rate (verified/unverified):</td>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={METooltip}
                  >
                    <td className="text-right" style={{ cursor: "pointer" }}>
                      {props.user.examples_submitted &&
                        (
                          (100 *
                            (props.user.total_fooled -
                              props.user.total_verified_not_correct_fooled)) /
                          props.user.examples_submitted
                        ).toFixed(2)}
                      % (
                      {props.user.total_fooled -
                        props.user.total_verified_not_correct_fooled}
                      /{props.user.examples_submitted}) /{" "}
                      {props.user.examples_submitted &&
                        (
                          (100 * props.user.total_fooled) /
                          props.user.examples_submitted
                        ).toFixed(2)}
                      % ({props.user.total_fooled}/
                      {props.user.examples_submitted})
                    </td>
                  </OverlayTrigger>
                </tr>
                <tr>
                  <td>Rejection rate:</td>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={RejectionTooltip}
                  >
                    <td className="text-right" style={{ cursor: "pointer" }}>
                      {props.user.examples_submitted &&
                        (
                          (100 * props.user.total_verified_not_correct_fooled) /
                          props.user.examples_submitted
                        ).toFixed(2)}
                      % (
                      {props.user.examples_submitted &&
                        props.user.total_verified_not_correct_fooled}
                      /{props.user.examples_submitted})
                    </td>
                  </OverlayTrigger>
                </tr>
                <tr>
                  <td>Retraction rate:</td>
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 250, hide: 400 }}
                    overlay={RetractionTooltip}
                  >
                    <td className="text-right" style={{ cursor: "pointer" }}>
                      {props.user.examples_submitted &&
                        (
                          (100 * props.user.total_retracted) /
                          props.user.examples_submitted
                        ).toFixed(2)}
                      % ({props.user.total_retracted}/
                      {props.user.examples_submitted})
                    </td>
                  </OverlayTrigger>
                </tr>
                <tr>
                  <td>Total validations:</td>
                  <td className="text-right">{props.user.examples_verified}</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <BadgeGrid user={props.user} />
      </Col>
    </Container>
  );
};

const NotificationsSubPage = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">
        Your Notifications
      </h1>
      <Col className="m-auto" lg={8}>
        <Card className="profile-card">
          <Card.Body>
            <Table className="mb-0">
              <thead className="blue-color border-bottom">
                <tr>
                  <td>
                    <b>When</b>
                  </td>
                  <td>
                    <b>Message</b>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!props.notifications.length ? (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center">No notifications found</div>
                    </td>
                  </tr>
                ) : null}
                {props.notifications.map((notification) => {
                  let message = notification.type + ": " + notification.message;
                  let created = (
                    <Moment utc fromNow>
                      {notification.created}
                    </Moment>
                  );
                  if (notification.type === "NEW_BADGE_EARNED") {
                    message = (
                      <span>
                        You've earned a new badge:{" "}
                        <Badge format="text" name={notification.message} />
                      </span>
                    );
                  } else if (notification.type === "BADGE_REMOVED_STREAK") {
                    message = (
                      <span>
                        At least one of your examples was validated as incorrect
                        or flagged, which resulted in the removal of the badge:{" "}
                        "<Badge format="text" name={notification.message} />" .
                        Win it back by generating more examples!
                      </span>
                    );
                  } else if (notification.type === "BADGE_REMOVED_MODEL") {
                    message = (
                      <span>
                        At least one of your models was unpublished, which
                        resulted in the removal of the badge: "
                        <Badge format="text" name={notification.message} />" .
                        Win it back by publishing more models!
                      </span>
                    );
                  }

                  if (!notification.seen) {
                    message = (
                      <strong>
                        <u>{message}</u>
                      </strong>
                    );
                    created = (
                      <strong>
                        <u>{created}</u>
                      </strong>
                    );
                  }
                  return (
                    <tr key={notification.id}>
                      <td>{created}</td>
                      <td>{message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={!props.notificationsPage}
                onClick={() => props.paginate("prev")}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={props.isEndOfNotificationsPage}
                onClick={() => props.paginate("next")}
              >
                Next
              </Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
    </Container>
  );
};

const ModelSubPage = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Your Models</h1>
      <Col className="m-auto" lg={8}>
        <Card className="profile-card">
          <Card.Body>
            <Table className="modelTable mb-0">
              <thead className="blue-color border-bottom">
                <tr>
                  <td>
                    <b>Name</b>
                  </td>
                  <td>
                    <b>Task</b>
                  </td>
                  <td className="text-right">
                    <b>Performance</b>
                  </td>
                  <td className="text-center" width="200px">
                    <b>Status</b>
                  </td>
                </tr>
              </thead>
              <tbody>
                {!props.userModels.length ? (
                  <tr>
                    <td colSpan="4">
                      <div className="text-center">No data found</div>
                    </td>
                  </tr>
                ) : null}
                {props.userModels.map((model) => {
                  return (
                    <tr
                      className="cursor-pointer"
                      key={model.id}
                      onClick={() => props.history.push(`/models/${model.id}`)}
                    >
                      <td className="blue-color">{model.name || "Unknown"}</td>
                      <td>
                        <TasksContext.Consumer>
                          {({ tasks }) => {
                            const task =
                              model && tasks.filter((e) => e.id === model.tid);
                            return task && task.length && task[0].shortname;
                          }}
                        </TasksContext.Consumer>
                      </td>
                      <td className="text-right">{model.overall_perf}</td>
                      <td className="text-center" width="200px">
                        {model.is_published === true ? (
                          <BBadge variant="success" className="publishStatus">
                            Published
                          </BBadge>
                        ) : (
                          <BBadge variant="danger" className="publishStatus">
                            Unpublished
                          </BBadge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card.Body>
          <Card.Footer className="text-center">
            <Pagination className="mb-0 float-right" size="sm">
              <Pagination.Item
                disabled={!props.userModelsPage}
                onClick={() => props.paginate("prev")}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={props.isEndOfUserModelsPage}
                onClick={() => props.paginate("next")}
              >
                Next
              </Pagination.Item>
            </Pagination>
          </Card.Footer>
        </Card>
      </Col>
    </Container>
  );
};

class ProfilePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      ctxUserId: null,
      user: {},
      userModels: [],
      userModelsPage: 0,
      notifications: [],
      notificationsPage: 0,
      pageLimit: 10,
      isEndOfUserModelsPage: true,
      isEndOfNotificationsPage: true,
      invalidFileUpload: false,
      loader: true,
    };
  }

  refreshData() {
    if (
      this.props.location.hash === "" ||
      this.props.location.hash === "#profile"
    ) {
      this.fetchUser();
    } else if (this.props.location.hash === "#notifications") {
      this.fetchNotifications(0);
    } else if (this.props.location.hash === "#stats") {
      this.fetchUser();
    } else if (this.props.location.hash === "#models") {
      this.fetchModels(0);
    }
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/account#profile"
      );
    } else {
      this.refreshData();
    }
  }

  fetchUser = () => {
    const user = this.context.api.getCredentials();
    this.context.api.getUser(user.id, true).then(
      (result) => {
        this.setState({ user: result, loader: false });
      },
      (error) => {
        console.log(error);
      }
    );
  };

  paginateUserModels = (state) => {
    const is_next = state === "next";
    const newUserModelsPage = is_next
      ? this.state.userModelsPage + 1
      : this.state.userModelsPage - 1;
    this.setState(
      {
        userModelsPage: newUserModelsPage,
      },
      () => {
        this.fetchModels(this.state.userModelsPage);
      }
    );
  };

  paginateNotifications = (state) => {
    const is_next = state === "next";
    const newNotificationsPage = is_next
      ? this.state.notificationsPage + 1
      : this.state.notificationsPage - 1;
    this.setState(
      {
        notificationsPage: newNotificationsPage,
      },
      () => {
        this.fetchNotifications(this.state.notificationsPage);
      }
    );
  };

  fetchNotifications = (page) => {
    const user = this.context.api.getCredentials();
    this.context.api.getNotifications(user.id, this.state.pageLimit, page).then(
      (result) => {
        const isEndOfPage =
          (page + 1) * this.state.pageLimit >= (result.count || 0);
        this.setState(
          {
            isEndOfNotificationsPage: isEndOfPage,
            notifications: result.data || [],
          },
          function () {
            this.context.api.setNotificationsSeen();
            this.context.user.unseen_notifications = 0;
          }
        );
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchModels = (page) => {
    const user = this.context.api.getCredentials();
    this.context.api.getUserModels(user.id, this.state.pageLimit, page).then(
      (result) => {
        const isEndOfPage =
          (page + 1) * this.state.pageLimit >= (result.count || 0);
        this.setState({
          isEndOfUserModelsPage: isEndOfPage,
          userModels: result.data || [],
        });
      },
      (error) => {
        console.log(error);
      }
    );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.refreshData();
    }
  }

  handleSubmit = (values, { setFieldError, setSubmitting }) => {
    const user = this.context.api.getCredentials();
    this.context.api.updateUser(user.id, values).then(
      (result) => {
        this.setState({ user: result });
        setSubmitting(false);
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Profile could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleAvatarChange = (e, props) => {
    const user = this.context.api.getCredentials();
    const files = e.target.files;
    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(files[0].name)) {
      this.setState({
        invalidFileUpload: true,
      });
      return;
    }
    this.setState({
      invalidFileUpload: false,
      loader: true,
      user: { ...this.state.user, avatar_url: "" },
    });
    this.context.api.updateProfilePic(user.id, files[0]).then(
      (result) => {
        props.updateState({
          user: {
            ...props.api.getCredentials(),
            avatar_url: result.avatar_url,
          },
        });
        this.setState({
          user: result,
          invalidFileUpload: false,
          loader: false,
        });
      },
      (error) => {
        console.log(error);
        this.setState({ invalidFileUpload: true, loader: false });
      }
    );
  };

  render() {
    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              <Nav.Item>
                <Nav.Link
                  href="#profile"
                  className={`gray-color p-4 px-lg-6 ${
                    this.props.location.hash === "#profile" ? "active" : ""
                  }`}
                >
                  Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#notifications"
                  className={`gray-color p-4 px-lg-6 ${
                    this.props.location.hash === "#notifications"
                      ? "active"
                      : ""
                  }`}
                >
                  Notifications
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#stats"
                  className={`gray-color p-4 px-lg-6 ${
                    this.props.location.hash === "#stats" ? "active" : ""
                  }`}
                >
                  Stats &amp; Badges
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#models"
                  className={`gray-color p-4 px-lg-6 ${
                    this.props.location.hash === "#models" ? "active" : ""
                  }`}
                >
                  Models
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col>
            {this.props.location.hash === "#profile" ? (
              <Container className="mb-5 pb-5">
                <h1 className="my-4 pt-3 text-uppercase text-center">
                  Your Profile
                </h1>
                <Col className="m-auto" lg={8}>
                  <Card>
                    <Container className="mt-3">
                      <Row>
                        <Col>
                          <UserContext.Consumer>
                            {(props) => (
                              <Avatar
                                avatar_url={this.state.user.avatar_url}
                                username={this.state.user.username}
                                isEditable={true}
                                theme="blue"
                                loader={this.state.loader}
                                handleUpdate={(e) =>
                                  this.handleAvatarChange(e, props)
                                }
                              />
                            )}
                          </UserContext.Consumer>
                          {this.state.invalidFileUpload ? (
                            <div className="text-center mt-4">
                              *Upload a valid file
                            </div>
                          ) : null}
                        </Col>
                      </Row>
                    </Container>
                    <Card.Body className="mt-4">
                      {this.state.user.email ? (
                        <Formik
                          initialValues={{
                            username: this.state.user.username,
                            realname: this.state.user.realname,
                            affiliation: this.state.user.affiliation,
                          }}
                          onSubmit={this.handleSubmit}
                        >
                          {({
                            values,
                            errors,
                            handleChange,
                            handleSubmit,
                            isSubmitting,
                            dirty,
                          }) => (
                            <>
                              <form className="px-4" onSubmit={handleSubmit}>
                                <Container>
                                  <Form.Group
                                    as={Row}
                                    controlId="username"
                                    className="py-3 my-0 border-bottom"
                                  >
                                    <Form.Label column sm="4">
                                      Username
                                    </Form.Label>
                                    <Col sm="8">
                                      <Form.Control
                                        type="text"
                                        defaultValue={this.state.user.username}
                                        onChange={handleChange}
                                      />
                                    </Col>
                                  </Form.Group>
                                  <Form.Group
                                    as={Row}
                                    controlId="email"
                                    className="py-3 my-0 border-bottom"
                                  >
                                    <Form.Label column sm="4">
                                      Email
                                    </Form.Label>
                                    <Col sm="8">
                                      <Form.Control
                                        plaintext
                                        disabled
                                        defaultValue={this.state.user.email}
                                      />
                                    </Col>
                                  </Form.Group>
                                  <Form.Group
                                    as={Row}
                                    controlId="realname"
                                    className="py-3 my-0 border-bottom"
                                  >
                                    <Form.Label column sm="4">
                                      Real name
                                    </Form.Label>
                                    <Col sm="8">
                                      <Form.Control
                                        type="text"
                                        defaultValue={this.state.user.realname}
                                        onChange={handleChange}
                                      />
                                    </Col>
                                  </Form.Group>
                                  <Form.Group
                                    as={Row}
                                    controlId="affiliation"
                                    className="py-3 my-0"
                                  >
                                    <Form.Label column sm="4">
                                      Affiliation
                                    </Form.Label>
                                    <Col sm="8">
                                      <Form.Control
                                        type="text"
                                        defaultValue={
                                          this.state.user.affiliation
                                        }
                                        onChange={handleChange}
                                      />
                                    </Col>
                                  </Form.Group>
                                  <Form.Group
                                    as={Row}
                                    controlId="affiliation"
                                    className="py-3 my-0"
                                  >
                                    <Col sm="8">
                                      <small className="form-text text-muted">
                                        {errors.accept}
                                      </small>
                                    </Col>
                                  </Form.Group>
                                  <Row className="justify-content-md-center">
                                    <Col md={5} sm={12}>
                                      {dirty ? (
                                        <Button
                                          type="submit"
                                          variant="primary"
                                          className="submit-btn button-ellipse text-uppercase my-4"
                                          disabled={isSubmitting}
                                        >
                                          Save
                                        </Button>
                                      ) : null}
                                    </Col>
                                  </Row>
                                </Container>
                              </form>
                            </>
                          )}
                        </Formik>
                      ) : (
                        ""
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Container>
            ) : null}
            {this.props.location.hash === "#models" ? (
              <ModelSubPage
                userModels={this.state.userModels}
                userModelsPage={this.state.userModelsPage}
                isEndOfUserModelsPage={this.state.isEndOfUserModelsPage}
                paginate={this.paginateUserModels}
                {...this.props}
              />
            ) : null}
            {this.props.location.hash === "#notifications" ? (
              <NotificationsSubPage
                notifications={this.state.notifications}
                notificationsPage={this.state.notificationsPage}
                isEndOfNotificationsPage={this.state.isEndOfNotificationsPage}
                paginate={this.paginateNotifications}
                {...this.props}
              />
            ) : null}
            {this.props.location.hash === "#stats" ? (
              <StatsSubPage user={this.state.user} />
            ) : null}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default ProfilePage;
