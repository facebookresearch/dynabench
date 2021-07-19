/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardGroup,
  Button,
  Form,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import { Formik } from "formik";
import UserContext from "./UserContext";
import DragAndDrop from "../components/DragAndDrop/DragAndDrop";
import "./SubmitInterface.css";

class SubmitInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {},
      datasets: [],
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    console.log("submit interface");
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent("/tasks/" + this.state.taskId + "/submit")
      );
    }

    this.setState({ taskId: params.taskId }, function () {
      this.context.api.getTask(this.state.taskId).then(
        (result) => {
          result.targets = result.targets.split("|"); // split targets
          this.setState({ task: result }, function () {
            this.context.api.getDatasets(result.id).then((datasets) => {
              this.setState({
                datasets: datasets.map((dataset) => dataset.name),
              });
            });
          });
        },
        (error) => {
          console.log(error);
        }
      );
    });
  }

  escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  handleValidation = (values) => {
    const errors = {};
    let allowedTaskExtension = ".json";
    const allowedExtensions = new RegExp(
      this.escapeRegExp(allowedTaskExtension) + "$",
      "i"
    );
    if (!values.roundType) {
      errors.roundType = "Required";
    }
    if (!values.file) {
      errors.file = "Required";
    } else if (!allowedExtensions.exec(values.file.name)) {
      errors.file =
        "Invalid file type - Please upload in " +
        allowedTaskExtension +
        " format";
    }
    return errors;
  };

  handleSubmit = (values, { setFieldValue, setSubmitting }) => {
    const reqObj = {
      task_id: this.state.taskId,
      dataset_names: this.state.datasets.toString(),
      file: values.file,
    };
    this.context.api.submitModelViaPredictions(reqObj).then(
      (result) => {
        var result = JSON.parse(result);
        console.log(result);
        this.props.history.push({
          pathname: `/tasks/${this.state.taskId}/models/${result["model"]["id"]}/publish`,
          state: { detail: result },
        });
      },
      (error) => {
        setSubmitting(false);
        setFieldValue("failed", "Failed To Submit. Plese try again");
        console.log(error);
      }
    );
  };

  render() {
    const datasetNavs = [];
    for (let i = 0; i < this.state.datasets.length; i++) {
      datasetNavs.push(
        <option key={i} value={i}>
          {this.state.datasets[i]}
        </option>
      );
    }

    return (
      <Container>
        <Row>
          <h2 className="text-uppercase blue-color">
            Submit your model results{" "}
          </h2>
        </Row>
        <Row>
          <CardGroup style={{ marginTop: 20, width: "100%" }}>
            <Card>
              <Card.Body>
                <p>
                  Upload predicted answers as a <em>.json</em> file.
                </p>
                <Formik
                  initialValues={{
                    file: null,
                    roundType: "overall",
                    failed: "",
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
                    <>
                      <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                      >
                        <Container>
                          <Row md={2}>
                            <Form.Group controlId="roundType">
                              <Form.Label>Your upload type:</Form.Label>
                              <Form.Control
                                as="select"
                                value={values.roundType}
                                onChange={handleChange}
                              >
                                {datasetNavs}
                              </Form.Control>
                            </Form.Group>
                          </Row>
                          <Row md={2}>
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
                                                setFieldValue("failed", "");
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
                                <>
                                  <DragAndDrop
                                    handleChange={(event) => {
                                      setValues({
                                        ...values,
                                        file: event.currentTarget.files[0],
                                        failed: "",
                                      });
                                    }}
                                    required={errors.file}
                                    name="file"
                                  >
                                    Drag
                                  </DragAndDrop>
                                </>
                              )}
                              <small className="form-text text-muted">
                                {errors.file}
                                {values.failed}
                              </small>
                            </Form.Group>
                          </Row>
                          <Button
                            type="submit"
                            variant="primary"
                            className="fadeIn third submitBtn button-ellipse"
                            disabled={isSubmitting}
                          >
                            Evaluate
                          </Button>
                        </Container>
                      </form>
                    </>
                  )}
                </Formik>
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default SubmitInterface;
