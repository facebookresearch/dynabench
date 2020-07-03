import React from "react";
import { Container, Col, Card, Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";

import UserContext from "./UserContext";

class UserPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      userId: null,
      user: {},
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    this.setState(params, function () {
      this.context.api
        .getUser(this.state.userId)
        .then((result) => {
          this.setState({ user: result });
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }
  render() {
    console.log(this.state);
    return (
      <Container>
        <h1 className="font-weight-bold my-4 pt-3 text-uppercase text-center">
          User Overview
        </h1>
        <Col className="m-auto" lg={8}>
          <Card className="profile-card">
            <Card.Body>
              <div className="d-flex justify-content-between mx-4 mt-4">
                <Card.Text className="task-page-header m-0">
                  {this.state.user.id
                    ? this.state.user.username
                    : "User unknown"}
                </Card.Text>
                <Button
                  className="blue-bg border-0 font-weight-bold"
                  aria-label="Back"
                  onClick={this.props.history.goBack}
                >
                  {"< Back"}
                </Button>
              </div>
              {this.state.user.id == this.context.user.id && (
                <Link className="ml-4" to="/profile">
                  Looking for your profile?
                </Link>
              )}
              <Table className="mb-0">
                <thead />
                <tbody>
                  <tr>
                    <td>Affiliation</td>
                    <td>{this.state.user.affiliation}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export default UserPage;
