import React from "react";
import { Container, Col, Card, Button, Table } from "react-bootstrap";
import UserContext from "./UserContext";

class ModelPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      modelId: this.props.match.params.modelId,
      model: {
        name: "",
        user: {
          username: "",
        },
      },
      scores: {},
    };
  }
  componentDidMount() {
    this.context.api
      .getModel(this.state.modelId)
      .then((result) => {
        this.setState({ model: result });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  render() {
    return (
      <Container>
        <h1 className="font-weight-bold my-4 pt-3 text-uppercase text-center">
          Model Overview
        </h1>
        <Col className="m-auto" lg={8}>
          <Card className="profile-card">
            <Card.Body>
              <div className="d-flex justify-content-between mx-4 mt-4">
                <Card.Text className="task-page-header m-0">
                  {this.state.model.name}
                </Card.Text>
                <Button
                  className="blue-bg border-0 font-weight-bold"
                  aria-label="Back"
                  onClick={this.props.history.goBack}
                >
                  {"< Back"}
                </Button>
              </div>
              <Table className="mb-0">
                <thead />
                <tbody>
                  <tr>
                    <td>Owner</td>
                    <td>
                      {this.state.model.user && this.state.model.user.username}
                    </td>
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

export default ModelPage;
