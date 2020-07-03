import React from "react";
import {
  Container,
  Row,
  Form,
  Col,
  Card,
  Table,
  Button,
} from "react-bootstrap";
import { Formik } from "formik";
import UserContext from "./UserContext";

class ProfilePage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      isDisabled: true,
    };
  }
  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/profile"
      );
    } else {
      const user = this.context.api.getCredentials();
      this.context.api
        .getUser(user.id)
        .then((result) => {
          this.setState({ user: result });
        })
        .catch((error) => {
          console.log("error", error);
        });
    }
  }
  handleToggle = () => {
    this.setState({ isDisabled: false });
  };
  handleSubmit = (values, { setSubmitting }) => {
    const user = this.context.api.getCredentials();
    this.context.api
      .updateUser(user.id, values)
      .then((result) => {
        setSubmitting(false);
        this.setState({ user: result, isDisabled: true });
      })
      .catch((error) => {
        console.log("error", error);
        setSubmitting(false);
      });
  };
  render() {
    return (
      <Container className="mb-5 pb-5">
        <h1 className="my-4 pt-3 text-uppercase text-center">Your Profile</h1>
        <Col className="m-auto" lg={8}>
          <Card>
            <h1 className="task-page-header mb-0 mx-4 mt-4">
              Profile
              {this.state.isDisabled && this.state.user.email ? (
                <Button onClick={this.handleToggle} className="float-right">
                  Edit
                </Button>
              ) : (
                ""
              )}
            </h1>
            <Card.Body>
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
                                disabled={this.state.isDisabled}
                                plaintext={this.state.isDisabled}
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
                                disabled={this.state.isDisabled}
                                plaintext={this.state.isDisabled}
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
                                disabled={this.state.isDisabled}
                                plaintext={this.state.isDisabled}
                                onChange={handleChange}
                              />
                            </Col>
                          </Form.Group>
                          <Row className="justify-content-md-center">
                            <Col md={5}>
                              {!this.state.isDisabled ? (
                                <Button
                                  type="submit"
                                  variant="primary"
                                  type="submit"
                                  className="submit-btn button-ellipse text-uppercase my-4"
                                  disabled={isSubmitting}
                                >
                                  Save
                                </Button>
                              ) : (
                                ""
                              )}
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
    );
  }
}

export default ProfilePage;
