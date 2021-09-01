/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button, Nav } from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import UserContext from "./UserContext";
import "./Sidebar-Layout.css";
import "./ProfilePage.css";
import "./ModelStatus.css";
import DragAndDrop from "../components/DragAndDrop/DragAndDrop";

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const handleContextValidation = (values) => {
  const errors = {};
  let allowedTaskExtension = ".jsonl";
  const allowedExtensions = new RegExp(
    escapeRegExp(allowedTaskExtension) + "$",
    "i"
  );

  if (values.file && !allowedExtensions.exec(values.file.name)) {
    errors.file =
      "Invalid file type - Please upload in " +
      allowedTaskExtension +
      " format";
  }
  return errors;
};

const Owners = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Owners</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                owners_string: props.owners_string,
                owner_to_toggle: null,
              }}
              onSubmit={props.handleOwnerUpdate}
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
                        controlId="owners"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Owners</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            plaintext
                            disabled
                            value={values.owners_string}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="owner_to_add"
                        className="py-3 my-0"
                      >
                        <Form.Label column>
                          <b>Add/Remove Owner</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            name="owner_to_toggle"
                            defaultValue={values.owner_to_toggle}
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
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

const Metrics = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Metrics</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                perf_metric: props.task.perf_metric,
                delta_metrics: props.task.delta_metrics,
                aggregation_metric: props.task.aggregation_metric,
                model_wrong_metric_config_json:
                  props.task.model_wrong_metric_config_json,
              }}
              onSubmit={props.handleTaskUpdate}
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
                        controlId="perf_metric"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Performance Metric</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            as="select"
                            onChange={handleChange}
                            value={values.perf_metric}
                          >
                            {props.availableMetricNames.eval.map(
                              (label, index) => (
                                <option key={index} value={label}>
                                  {label}
                                </option>
                              )
                            )}
                          </Form.Control>
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="aggregation_metric"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Aggregation Metric</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            as="select"
                            onChange={handleChange}
                            value={values.aggregation_metric}
                          >
                            {props.availableMetricNames.aggregation.map(
                              (label, index) => (
                                <option key={index} value={label}>
                                  {label}
                                </option>
                              )
                            )}
                          </Form.Control>
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="delta_metrics"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Delta Metrics</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            name="delta_metrics"
                            defaultValue={values.delta_metrics}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="model_wrong_metric_config_json"
                        className="py-3 my-0"
                      >
                        <Form.Label column>
                          <b>Model Wrong Metric Config JSON</b>
                        </Form.Label>
                        <Form.Control
                          name="model_wrong_metric_config_json"
                          defaultValue={values.model_wrong_metric_config_json}
                          onChange={handleChange}
                        />
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
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

const Settings = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Settings</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                annotation_config_json: props.task.annotation_config_json,
                hidden: props.task.hidden,
                submitable: props.task.submitable,
                instructions_md: props.task.instructions_md,
              }}
              onSubmit={props.handleTaskUpdateWithActivate}
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
                        controlId="hidden"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Hidden</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Check
                            checked={values.hidden}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="submitable"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Submitable</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Check
                            checked={values.submitable}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="hidden"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Annotation Config JSON</b>
                        </Form.Label>
                        {props.task.active ? (
                          <Form.Control
                            plaintext
                            disabled
                            rows="24"
                            as="textarea"
                            defaultValue={values.annotation_config_json}
                          />
                        ) : (
                          <Form.Control
                            as="textarea"
                            name="annotation_config_json"
                            defaultValue={values.annotation_config_json}
                            rows="24"
                            onChange={handleChange}
                          />
                        )}
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="instructions_md"
                        className="py-3 my-0"
                      >
                        <Form.Label column>
                          <b>Instructions MD</b>
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          name="instructions_md"
                          defaultValue={values.instructions_md}
                          rows="12"
                          onChange={handleChange}
                        />
                        <Form.Text id="paramsHelpBlock" muted>
                          <Markdown>
                            The text will be rendered as
                            [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                            in the create interface.
                          </Markdown>
                        </Form.Text>
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
                        {dirty ? (
                          props.task.active ? (
                            <Col md={5} sm={12}>
                              <Button
                                type="submit"
                                variant="primary"
                                className="submit-btn button-ellipse text-uppercase my-4"
                                disabled={isSubmitting}
                              >
                                Save
                              </Button>
                            </Col>
                          ) : (
                            <Button
                              type="submit"
                              variant="danger"
                              size="lg"
                              className="text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              Activate Task <br />{" "}
                              <small>
                                (WARNING: Annotation Config JSON will be fixed)
                              </small>
                            </Button>
                          )
                        ) : null}
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
};

const Contexts = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Contexts</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                file: null,
              }}
              validate={handleContextValidation}
              onSubmit={props.handleContextSubmit}
            >
              {({
                values,
                errors,
                handleChange,
                setFieldValue,
                handleSubmit,
                isSubmitting,
                setValues,
                dirty,
              }) => (
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                  <Container>
                    <Form.Group>
                      Add new contexts to the current round by uploading them
                      here, as a jsonl where each line has three fields: <br />{" "}
                      <br />
                      <b>context</b>: a json-style dict with keys and values for
                      each of the context components in your task's Annotation
                      Config JSON.
                      <br />
                      <b>tag</b>: a string that associates this context with a
                      set of other contexts <br />
                      <b>metadata</b>: a dictionary in json format representing
                      any other data that is useful to you <br /> <br />
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
                        <DragAndDrop
                          handleChange={(event) => {
                            setValues({
                              ...values,
                              file: event.currentTarget.files[0],
                            });
                          }}
                          name="file"
                        >
                          Drag
                        </DragAndDrop>
                      )}
                      <Col sm="8">
                        <small className="form-text text-muted">
                          {errors.file}
                          {errors.accept}
                        </small>
                      </Col>
                    </Form.Group>
                    <Row className="justify-content-md-center">
                      <Col md={5} sm={12}>
                        {values.file !== null && !errors.file ? (
                          <Button
                            type="submit"
                            variant="primary"
                            className="submit-btn button-ellipse text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Upload
                          </Button>
                        ) : null}
                      </Col>
                    </Row>
                  </Container>
                </form>
              )}
            </Formik>
          </Card.Body>
        </Card>
      </Col>
    </Container>
  );
};

class TaskOwnerPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      task: null,
      owners_string: null,
      availableMetricNames: null,
      loader: true,
    };
  }

  refreshData() {
    if (
      this.props.location.hash === "" ||
      this.props.location.hash === "#settings"
    ) {
      this.fetchTask();
    } else if (this.props.location.hash === "#owners") {
      this.fetchTask().then(() => this.fetchOwners());
    } else if (this.props.location.hash === "#contexts") {
      this.fetchTask();
    } else if (this.props.location.hash === "#rounds") {
      this.fetchTask();
    } else if (this.props.location.hash === "#models") {
      // TODO
    } else if (this.props.location.hash === "#datasets") {
      // TODO
    } else if (this.props.location.hash === "#metrics") {
      this.fetchTask();
      this.fetchAvailableMetricNames();
    }
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/owner#profile"
      );
    } else {
      this.refreshData();
    }
  }

  fetchTask = (callback = () => {}) => {
    return this.context.api.getTask(this.props.match.params.taskCode).then(
      (result) => {
        this.setState({ task: result, loader: false }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchOwners = (callback = () => {}) => {
    return this.context.api.getOwners(this.state.task.id).then(
      (result) => {
        this.setState(
          { owners_string: result.join(", "), loader: false },
          callback
        );
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchAvailableMetricNames = (callback = () => {}) => {
    this.context.api.getAvailableMetricNames().then(
      (result) => {
        this.setState(
          { availableMetricNames: result, loader: false },
          callback
        );
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

  handleContextSubmit = (
    values,
    { setFieldError, setFieldValue, setSubmitting }
  ) => {
    const reqObj = {
      taskId: this.state.task.id,
      file: values.file,
    };
    this.context.api.submitContexts(reqObj).then(
      (result) => {
        setSubmitting(false);
        setFieldValue("file", null, false);
      },
      (error) => {
        setSubmitting(false);
        setFieldError(
          "accept",
          "File could not be submitted (" + error.error + ")"
        );
        console.log(error);
      }
    );
  };

  handleTaskUpdateWithActivate = (
    values,
    { setFieldError, setSubmitting, resetForm }
  ) => {
    if (
      this.state.task.active === false &&
      values.hasOwnProperty("annotation_config_json")
    ) {
      this.context.api
        .activateTask(this.state.task.id, values.annotation_config_json)
        .then(
          (result) => {
            this.handleTaskUpdate(values, {
              setFieldError,
              setSubmitting,
              resetForm,
            });
          },
          (error) => {
            console.log(error);
            setFieldError(
              "accept",
              "Task could not be updated (" + error.error + ")"
            );
            setSubmitting(false);
          }
        );
    } else {
      this.handleTaskUpdate(values, {
        setFieldError,
        setSubmitting,
        resetForm,
      });
    }
  };

  handleTaskUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    const allowed = [
      "aggregation_metric",
      "model_wrong_metric_config_json",
      "instructions_md",
      "hidden",
      "submitable",
      "perf_metric",
      "delta_metrics",
      "create_endpoint",
    ];

    const data = Object.keys(values)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    this.context.api.updateTask(this.state.task.id, data).then(
      (result) => {
        this.fetchTask(() => {
          resetForm({ values: data });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Task could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleOwnerUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    this.context.api
      .toggleOwner(this.state.task.id, values.owner_to_toggle)
      .then(
        () => {
          this.fetchOwners(() => {
            console.log(this.state.owners_string);
            resetForm({
              values: {
                owners_string: this.state.owners_string,
                owner_to_toggle: null,
              },
            });
            setSubmitting(false);
          });
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Task could not be updated (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  render() {
    const navOptions = [
      {
        href: "#settings",
        buttonText: "Settings",
      },
      {
        href: "#owners",
        buttonText: "Owners",
      },
      {
        href: "#contexts",
        buttonText: "Contexts",
      },
      {
        href: "#rounds",
        buttonText: "Rounds",
      },
      {
        href: "#models",
        buttonText: "Models",
      },
      {
        href: "#datasets",
        buttonText: "Datasets",
      },
      {
        href: "#metrics",
        buttonText: "Metrics",
      },
    ];

    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              {navOptions.map((navOption) => (
                <Nav.Item key={navOption.href}>
                  <Nav.Link
                    href={navOption.href}
                    className={`gray-color p-4 px-lg-6 ${
                      this.props.location.hash === navOption.href
                        ? "active"
                        : ""
                    }`}
                  >
                    {navOption.buttonText}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
          <Col>
            {this.props.location.hash === "#settings" && this.state.task ? (
              <Settings
                task={this.state.task}
                handleTaskUpdateWithActivate={this.handleTaskUpdateWithActivate}
              />
            ) : null}
            {this.props.location.hash === "#owners" &&
            this.state.owners_string ? (
              <Owners
                owners_string={this.state.owners_string}
                handleOwnerUpdate={this.handleOwnerUpdate}
              />
            ) : null}
            {this.props.location.hash === "#contexts" ? (
              <Contexts handleContextSubmit={this.handleContextSubmit} />
            ) : null}
            {this.props.location.hash === "#metrics" &&
            this.state.task &&
            this.state.availableMetricNames ? (
              <Metrics
                availableMetricNames={this.state.availableMetricNames}
                task={this.state.task}
                handleTaskUpdate={this.handleTaskUpdate}
              />
            ) : null}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TaskOwnerPage;
