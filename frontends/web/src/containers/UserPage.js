/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Col,
  Row,
  Card,
  Pagination,
  Table,
  Form,
  Nav,
  Tooltip,
  OverlayTrigger,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar/Avatar";
import "./Sidebar-Layout.css";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import BadgeGrid from "./BadgeGrid";
import {
  METooltip,
  RetractionTooltip,
  RejectionTooltip
} from "./UserStatTooltips";

class UserPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.match.params.userId,
      user: {},
      userModels: [],
      userModelsPage: 0,
      pageLimit: 10,
      isEndOfUserModelsPage: true,
    };
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          `&src=/users/${this.props.match.params.userId}#profile`
      );
    } else {
      if (this.props.location.hash === "") {
        this.props.location.hash = "#profile";
      }
      this.props.location.hash === "#profile"
        ? this.fetchUser()
        : this.fetchModel(0);
    }
  }

  fetchUser = () => {
    this.context.api
      .getUser(this.state.userId, true)
      .then((result) => {
        this.setState({ user: result });
      }, (error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
      });
  };

  fetchModel = (page) => {
    this.context.api
      .getUserModels(this.state.userId, this.state.pageLimit, page)
      .then((result) => {
        const isEndOfPage =
          (page + 1) * this.state.pageLimit >= (result.count || 0);
        this.setState({
          isEndOfUserModelsPage: isEndOfPage,
          userModels: result.data || [],
        });
      }, (error) => {
        console.log(error);
      });
  };

  paginate = (state) => {
    this.setState(
      {
        userModelsPage:
          state === "next"
            ? ++this.state.userModelsPage
            : --this.state.userModelsPage,
      },
      () => {
        this.fetchModel(this.state.userModelsPage);
      }
    );
  };

  getInitial = (name) => {
    return (
      name &&
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.setState(
        {
          user: {},
          userModels: [],
        },
        () => {
          this.props.location.hash === "#profile"
            ? this.fetchUser()
            : this.fetchModel(0);
        }
      );
    }
  }

  render() {
    const pageHash = this.props.location.hash;
    return (
      <div className="container-area">
        <div className="left-sidebar">
          <div className="left-sticky-sidebar">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              <Nav.Item>
                <Nav.Link
                  href="#profile"
                  className={`gray-color p-3 px-lg-5 ${
                    pageHash === "#profile" ? "active" : ""
                  }`}
                >
                  Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#models"
                  className={`gray-color p-3 px-lg-5 ${
                    pageHash === "#models" ? "active" : ""
                  }`}
                >
                  Models
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </div>
        <div id="content-area" className="snippet-hidden">
          <Container>
            {pageHash === "#profile" ? (
              <>
                <h1 className="my-4 pt-3 text-uppercase text-center">
                  User Overview
                </h1>
                <Col className="m-auto" lg={12}>
                  {this.state.user.id && (
                    <>
                    <Card>
                      <Container className="mt-3">
                        <Row>
                          <Col>
                            <Avatar
                              avatar_url={this.state.user.avatar_url}
                              username={this.state.user.username}
                              theme="blue"
                            />
                          </Col>
                        </Row>
                      </Container>
                      <Card.Body>
                        <Form.Group as={Row}>
                          <Form.Label column sm="6" className="text-right">
                            Username:
                          </Form.Label>
                          <Col sm="6">
                            <Form.Control
                              plaintext
                              readOnly
                              defaultValue={this.state.user.username}
                            />
                          </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                          <Form.Label column sm="6" className="text-right">
                            Affiliation:
                          </Form.Label>
                          <Col sm="6">
                            <Form.Control
                              plaintext
                              readOnly
                              defaultValue={this.state.user.affiliation}
                            />
                          </Col>
                        </Form.Group>
                        <OverlayTrigger
                          placement="bottom"
                          delay={{ show: 250, hide: 400 }}
                          overlay={METooltip}
                        >
                          <Form.Group as={Row}>
                            <Form.Label column sm="6" className="text-right">
                              Model error:
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                plaintext
                                readOnly
                                defaultValue={
                                  this.state.user.examples_submitted > 0 ?
                                    (100 *
                                      this.state.user.total_fooled /
                                      this.state.user.examples_submitted
                                    ).toFixed(2).toString() + "% (rate) " +
                                    this.state.user.total_fooled.toString() + " (count) " +
                                    (100 *
                                      this.state.user.total_verified_fooled /
                                      this.state.user.examples_submitted
                                    ).toFixed(2).toString() + "% (verified rate) " +
                                    this.state.user.total_verified_fooled.toString() + " (verified count)"
                      : 'N/A'}
                              />
                            </Col>
                          </Form.Group>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="bottom"
                          delay={{ show: 250, hide: 400 }}
                          overlay={RejectionTooltip}
                        >
                          <Form.Group as={Row}>
                            <Form.Label column sm="6" className="text-right">
                              Rejection:
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                plaintext
                                readOnly
                                defaultValue={
                                  this.state.user.examples_submitted > 0 ?
                                    (100 *
                                      (this.state.user.total_fooled - this.state.user.total_verified_fooled) /
                                      this.state.user.examples_submitted
                                    ).toFixed(2).toString() + "% (rate) " +
                                    (this.state.user.total_fooled - this.state.user.total_verified_fooled).toString() + " (count)"
                      : 'N/A'}
                              />
                            </Col>
                          </Form.Group>
                        </OverlayTrigger>
                        <OverlayTrigger
                          placement="bottom"
                          delay={{ show: 250, hide: 400 }}
                          overlay={RetractionTooltip}
                        >
                          <Form.Group as={Row}>
                            <Form.Label column sm="6" className="text-right">
                              Retraction:
                            </Form.Label>
                            <Col sm="6">
                              <Form.Control
                                plaintext
                                readOnly
                                defaultValue={
                                  this.state.user.examples_submitted > 0 ?
                                    (100 * this.state.user.total_retracted /
                                      this.state.user.examples_submitted
                                    ).toFixed(2).toString() + '% (rate) ' +
                                    this.state.user.total_retracted.toString() + ' (count)'
                      : 'N/A'}
                              />
                            </Col>
                          </Form.Group>
                        </OverlayTrigger>
                      </Card.Body>
                      {this.state.user.id == this.context.user.id && (
                        <Card.Footer>
                          <Row>
                            <Col className="text-center">
                              <Link className="" to="/account#profile">
                                Looking for your profile?
                              </Link>
                            </Col>
                          </Row>
                        </Card.Footer>
                      )}
                    </Card>
                    <BadgeGrid user={this.state.user} />
                    </>
                  )}
                </Col>
              </>
            ) : null}
            {pageHash === "#models" ? (
              <>
                <h1 className="my-4 pt-3 text-uppercase text-center">
                  User Models
                </h1>
                <Col className="m-auto" lg={8}>
                  <Card className="profile-card">
                    <Card.Body>
                      <Table className="mb-0">
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
                          </tr>
                        </thead>
                        <tbody>
                          {!this.state.userModels.length ? (
                            <tr>
                              <td colSpan="3">
                                <div className="text-center">No data found</div>
                              </td>
                            </tr>
                          ) : null}
                          {this.state.userModels.map((model) => {
                            return (
                              <tr key={model.id}>
                                <td>
                                  <Link to={`/models/${model.id}`}>
                                    {model.name || "Unknown"}
                                  </Link>
                                </td>
                                <td>
                                  <TasksContext.Consumer>
                                    {({ tasks }) => {
                                      const task =
                                        model &&
                                        tasks.filter((e) => e.id == model.tid);
                                      return (
                                        task && task.length && task[0].shortname
                                      );
                                    }}
                                  </TasksContext.Consumer>
                                </td>
                                <td className="text-right">
                                  {model.overall_perf}
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
                          disabled={!this.state.userModelsPage}
                          onClick={() => this.paginate("prev")}
                        >
                          Previous
                        </Pagination.Item>
                        <Pagination.Item
                          disabled={this.state.isEndOfUserModelsPage}
                          onClick={() => this.paginate("next")}
                        >
                          Next
                        </Pagination.Item>
                      </Pagination>
                    </Card.Footer>
                  </Card>
                </Col>
              </>
            ) : null}
          </Container>
        </div>
      </div>
    );
  }
}

export default UserPage;
