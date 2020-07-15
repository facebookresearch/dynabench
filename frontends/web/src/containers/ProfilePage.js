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
  Badge,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Formik } from "formik";
import TasksContext from "./TasksContext";
import UserContext from "./UserContext";
import { Avatar } from "../components/Avatar/Avatar";
import "./Sidebar-Layout.css";
import "./ProfilePage.css";

class ProfilePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      ctxUserId: null,
      user: {},
      userModels: [],
      userModelsPage: 0,
      pageLimit: 10,
      isEndOfUserModelsPage: true,
      invalidFileUpload: false,
    };
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/account#profile"
      );
    } else {
      const user = this.context.api.getCredentials();
      this.setState(
        {
          ctxUserId: user.id,
        },
        () => {
          this.props.location.hash === "#profile" ||
          this.props.location.hash === ""
            ? this.fetchUser()
            : this.fetchModels(0);
        }
      );
    }
  }

  fetchUser = () => {
    const { ctxUserId } = this.state;
    this.context.api
      .getUser(ctxUserId)
      .then((result) => {
        this.setState({ user: result });
      })
      .catch((error) => {
        console.log("error", error);
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
        this.fetchModels(this.state.userModelsPage);
      }
    );
  };

  fetchModels = (page) => {
    const { ctxUserId } = this.state;
    this.context.api
      .getUserModels(ctxUserId, this.state.pageLimit, page)
      .then((result) => {
        const isEndOfPage =
          (page + 1) * this.state.pageLimit >= (result.count || 0);
        this.setState({
          isEndOfUserModelsPage: isEndOfPage,
          userModels: result.data || [],
        });
      })
      .catch((error) => {
        console.log(error);
      });
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
            : this.fetchModels(0);
        }
      );
    }
  }

  handleSubmit = (values, { setSubmitting }) => {
    const user = this.context.api.getCredentials();
    this.context.api
      .updateUser(user.id, values)
      .then((result) => {
        this.setState({ user: result });
        setSubmitting(false);
      })
      .catch((error) => {
        console.log("error", error);
      });
  };

  handleAvatarChange = (e) => {
    const user = this.context.api.getCredentials();
    const files = e.target.files;
    var allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(files[0].name)) {
      this.setState({
        invalidFileUpload: true,
      });
      return;
    }
    this.context.api
      .updateProfilePic(user.id, files[0])
      .then((result) => {
        this.setState({ user: result, invalidFileUpload: true });
      })
      .catch((error) => {
        console.log("error", error);
        this.setState({ invalidFileUpload: true });
      });
  };

  render() {
    return (
      <div className="container-area">
        <div className="left-sidebar">
          <div className="left-sticky-sidebar">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              <Nav.Item>
                <Nav.Link
                  href="#profile"
                  className={`gray-color p-3 px-lg-5 ${
                    this.props.location.hash === "#profile" ? "active" : ""
                  }`}
                >
                  Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#models"
                  className={`gray-color p-3 px-lg-5 ${
                    this.props.location.hash === "#models" ? "active" : ""
                  }`}
                >
                  Models
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>
        </div>
        <div id="content-area" className="snippet-hidden">
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
                        <Avatar
                          avatar_url={this.state.user.avatar_url}
                          username={this.state.user.username}
                          isEditable={true}
                          theme="blue"
                          handleUpdate={this.handleAvatarChange}
                        />
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
                                      defaultValue={this.state.user.affiliation}
                                      onChange={handleChange}
                                    />
                                  </Col>
                                </Form.Group>
                                <Row className="justify-content-md-center">
                                  <Col md={5} sm={12}>
                                    {dirty ? (
                                      <Button
                                        type="submit"
                                        variant="primary"
                                        type="submit"
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
            <Container className="mb-5 pb-5">
              <h1 className="my-4 pt-3 text-uppercase text-center">
                Your Models
              </h1>
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
                        {!this.state.userModels.length ? (
                          <tr>
                            <td colSpan="4">
                              <div className="text-center">No data found</div>
                            </td>
                          </tr>
                        ) : null}
                        {this.state.userModels.map((model) => {
                          return (
                            <tr
                              className="cursor-pointer"
                              key={model.id}
                              onClick={() =>
                                this.props.history.push(`/models/${model.id}`)
                              }
                            >
                              <td className="blue-color">
                                {model.name || "Unknown"}
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
                              <td className="text-center" width="200px">
                                {model.is_published === "True" ? (
                                  <Badge
                                    variant="success"
                                    className="publishStatus"
                                  >
                                    Published
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="danger"
                                    className="publishStatus"
                                  >
                                    Unpublished
                                  </Badge>
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
            </Container>
          ) : null}
        </div>
      </div>
    );
  }
}

export default ProfilePage;
