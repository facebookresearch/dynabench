import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardGroup,
  Button,
  Form,
} from "react-bootstrap";
import { Formik } from "formik";
import UserContext from "./UserContext";
import "./SubmitInterface.css";

class PublishInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: props.match.params.taskId,
      modelId: props.match.params.modelId,
      model: {},
      accuracy: "",
      scores: [],
      isPublished: false,
    };
  }
  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent("/tasks/" + this.state.taskId + "/submit")
      );
    }
    const propState = this.props.location.state;
    if (!propState) {
      this.props.history.push("/");
      return;
    }
    this.setState({
      model: propState.detail,
      accuracy: (propState.detail && propState.detail.overall_perf) || "",
      scores: (propState.detail && propState.detail.scores) || [],
      isPublished: (propState.detail && propState.detail.isPublished) || false,
    });
  }
  handleValidation = (values) => {
    const errors = {};
    if (!values.name) {
      errors.name = "Required";
    }
    return errors;
  };
  handleSubmit = (values, { setSubmitting }) => {
    const reqObj = {
      modelId: this.state.model.id,
      name: values.name,
      description: values.description,
    };
    this.context.api
      .publishModel(reqObj)
      .then(() => {
        this.props.history.push(`/tasks/${this.state.taskId}#overall`);
      })
      .catch((error) => {
        console.log(error);
        setSubmitting(false);
      });
  };

  render() {
    const { model } = this.state;
    let orderedScores = (model.scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );

    return (
      <Container>
        <Row>
          <h2 className="text-uppercase blue-color">Publish your model </h2>
        </Row>
        <Row>
          <CardGroup style={{ marginTop: 20, width: "100%" }}>
            <Card>
              <Card.Body>
                <Container>
                  <Row className="mt-4">
                    <Col sm="4" className="mb-2">
                      <b>Your Accuracy</b>
                    </Col>
                    <Col sm="8">
                      <b>{model.overall_perf}%</b>
                    </Col>
                  </Row>
                  {orderedScores.map((data) => {
                    return (
                      <Row key={data.round_id}>
                        <Col sm="5" className="row-wise">
                          Round {data.round_id}
                        </Col>
                        <Col sm="7">{data.accuracy}%</Col>
                      </Row>
                    );
                  })}
                </Container>
                {Object.keys(model).length ? (
                  <Formik
                    initialValues={{
                      name: model.name || "",
                      description: model.longdesc || "",
                    }}
                    validate={this.handleValidation}
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
                        <form onSubmit={handleSubmit} className="mt-5 ml-2">
                          <Form.Group>
                            <Form.Label>
                              <b>Model Name</b>
                            </Form.Label>
                            <Form.Control
                              name="name"
                              type="text"
                              style={{
                                borderColor: errors.name ? "red" : null,
                              }}
                              placeholder="Provide a name for your model"
                              onChange={handleChange}
                              value={values.name}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Description</b>
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              name="description"
                              defaultValue={values.description}
                              rows="3"
                              onChange={handleChange}
                            />
                          </Form.Group>

                          {model.is_published == "False" ? (
                            <Button
                              type="submit"
                              variant="primary"
                              className="fadeIn third submitBtn button-ellipse"
                              disabled={isSubmitting}
                            >
                              Publish
                            </Button>
                          ) : null}
                        </form>
                      </>
                    )}
                  </Formik>
                ) : null}
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default PublishInterface;
