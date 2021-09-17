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
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Formik } from "formik";
import UserContext from "./UserContext";
import DragAndDrop from "../components/DragAndDrop/DragAndDrop";

const FileUpload = (props) => {
  return props.values[props.filename] ? (
    <div className="UploadResult">
      <Card>
        <Card.Body>
          <Container>
            <Row>
              <Col md={10}>{props.values[props.filename].name}</Col>
              <Col md={2}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={(event) => {
                    props.setFieldValue(props.filename, null);
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
        props.setFieldValue(props.filename, event.currentTarget.files[0]);
      }}
    >
      Drag
    </DragAndDrop>
  );
};

class SubmitInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      task: {},
      datasets: [],
      showModals: [],
    };
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" +
          encodeURIComponent("/tasks/" + this.state.task_code + "/submit")
      );
    }

    this.setState({ taskId: params.taskId }, function () {
      this.context.api.getTask(this.state.taskId).then(
        (result) => {
          this.setState({ task: result }, function () {
            this.context.api.getDatasets(result.id).then((datasets) => {
              this.setState({
                datasets: datasets,
                showModals: datasets.map((dataset) => false),
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

  handleSubmit = (
    values,
    { setFieldValue, setSubmitting, resetForm, setFieldError }
  ) => {
    const files = {};
    for (const dataset of this.state.datasets) {
      files[dataset.name] = values[dataset.name];
    }
    this.context.api
      .uploadPredictions(this.state.task.id, values.modelName, files)
      .then(
        (result) => {
          values.modelName = "";
          for (const [fname, _] of Object.entries(files)) {
            values[fname] = null;
          }
          values.submittedModelId = result.model_id;
          resetForm({ values: values });
          setSubmitting(false);
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Dataset cound not be added (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  render() {
    const files = {};
    for (const dataset of this.state.datasets) {
      files[dataset.name] = null;
    }
    return (
      <Container className="mb-5 pb-5">
        <h1 className="my-4 pt-3 text-uppercase text-center">
          Submit Model Predictions
        </h1>
        <Col>
          <Card className="my-4">
            <Card.Body>
              <Formik
                initialValues={Object.assign(
                  {
                    modelName: "",
                  },
                  files
                )}
                onSubmit={this.handleSubmit}
              >
                {({
                  dirty,
                  values,
                  errors,
                  handleChange,
                  setFieldValue,
                  handleSubmit,
                  isSubmitting,
                  setValues,
                }) => (
                  <>
                    <form className="px-4" onSubmit={handleSubmit}>
                      <Container>
                        <Form.Group as={Row} className="py-3 my-0">
                          <p>
                            Upload predicted answers as a <em>.jsonl</em> file,
                            where each line has a field for each of the model
                            output fields. These outputs are defined in the
                            config JSON for this task. Additionally, there
                            should be a field called "uid" that matches the
                            "uid" field of the example that the prediction is
                            for.
                            <br />
                            <br />
                            You don't need to upload results for all datasets
                            for us to run the evaluation, but your model won't
                            appear on the leaderboard if you don't upload
                            predictions for all of the leaderboard datasets.
                          </p>
                        </Form.Group>
                        <Form.Group
                          as={Row}
                          controlId="modelName"
                          className="py-3 my-0 border-top"
                        >
                          <Form.Label column>Model Name</Form.Label>
                          <Col sm={8}>
                            <Form.Control
                              value={values.modelName}
                              onChange={handleChange}
                            />
                          </Col>
                        </Form.Group>
                        {this.state.datasets.map((dataset, index) => (
                          <div key={index}>
                            <Modal
                              show={this.state.showModals[index]}
                              onHide={() =>
                                this.setState({
                                  showModals: this.state.showModals.map(
                                    (obj, obj_index) =>
                                      index === obj_index ? !obj : obj
                                  ),
                                })
                              }
                            >
                              <Modal.Header closeButton>
                                <Modal.Title>{dataset.name}</Modal.Title>
                              </Modal.Header>
                              <Modal.Body>
                                {dataset.longdesc}
                                <br />
                                <br />
                                {dataset.source_url &&
                                dataset.source_url !== "" ? (
                                  <Button href={dataset.source_url}>
                                    <i className="fas fa-newspaper"></i> Read
                                    Paper
                                  </Button>
                                ) : (
                                  ""
                                )}
                              </Modal.Body>
                            </Modal>
                            <Form.Group
                              as={Row}
                              className="py-3 my-0 border-top"
                            >
                              <Form.Label column>Dataset</Form.Label>
                              <Col sm={8}>
                                <span
                                  className="btn-link dataset-link"
                                  onClick={() =>
                                    this.setState({
                                      showModals: this.state.showModals.map(
                                        (obj, obj_index) =>
                                          index === obj_index ? !obj : obj
                                      ),
                                    })
                                  }
                                >
                                  {dataset.name}
                                </span>
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row} className="py-3 my-0">
                              <Form.Label column>Predictions</Form.Label>
                              <Col sm={8}>
                                <FileUpload
                                  values={values}
                                  filename={dataset.name}
                                  setFieldValue={setFieldValue}
                                />
                              </Col>
                            </Form.Group>
                          </div>
                        ))}
                        <Form.Group as={Row} className="py-3 my-0">
                          <Col sm="8">
                            <small className="form-text text-muted">
                              {errors.accept}
                            </small>
                          </Col>
                          {values.submittedModelId && (
                            <Col sm="8">
                              <small className="form-text text-muted">
                                Thanks for your submission. You can view it{" "}
                                <Link to={"/models/" + values.submittedModelId}>
                                  here
                                </Link>
                                . Scores may not be ready immediatly, so check
                                on your submission later.
                              </small>
                            </Col>
                          )}
                        </Form.Group>
                        <Row className="justify-content-md-center">
                          <Col md={5} sm={12}>
                            {dirty && values.modelName !== "" ? (
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
            </Card.Body>
          </Card>
        </Col>
      </Container>
    );
  }
}

export default SubmitInterface;
