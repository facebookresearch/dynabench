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
      taskId: props.match.params.taskId,
    };
  }
  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent("/tasks/" + this.state.taskId + "/submit")
      );
    }
  }

  handleValidation = (values) => {
    const errors = {};
    const allowedExtensions = /(\.txt)$/i;
    if (!values.roundType) {
      errors.roundType = "Required";
    }
    if (!values.file) {
      errors.file = "Required";
    } else if (!allowedExtensions.exec(values.file.name)) {
      errors.file = "Invalid file type - Please upload in .txt format";
    }
    return errors;
  };

  handleSubmit = (values, { setFieldValue, setSubmitting }) => {
    const reqObj = {
      taskId: this.state.taskId,
      roundType: values.roundType,
      file: values.file,
    };
    this.context.api
      .submitModel(reqObj)
      .then((result) => {
        this.props.history.push({
          pathname: `/tasks/${this.state.taskId}/models/${result.model_id}/publish`,
          state: { detail: result },
        });
      }, (error) => {
        setSubmitting(false);
        setFieldValue("failed", "Failed To Submit. Plese try again");
        console.log(error);
      });
  };

  render() {
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
                  Concatenate with each example's prediction per line, labeled as in <a href="https://github.com/facebookresearch/anli">ANLI</a>'s predicted_label
                  default output format (e=Entailment, c=Contradiction, n=Neutral). If you submit for multiple rounds in one go (i.e., overall),
                  concatenate in order (so first the answers, one per line, for round 1; then for round 2; then for round 3; in order).
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
                              <Form.Label>Choose your upload type:</Form.Label>
                              <Form.Control
                                as="select"
                                value={values.roundType}
                                onChange={handleChange}
                              >
                                <option value="overall">Overall</option>
                                <option value="1">Round 1</option>
                                <option value="2">Round 2</option>
                                <option value="3">Round 3</option>
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
