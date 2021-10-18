/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { useState } from "react";
import {
  Container,
  Row,
  Form,
  Col,
  Card,
  Button,
  Spinner,
} from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import WeightIndicator from "../WeightComponents/WeightIndicator";
import WeightSlider from "../WeightComponents/WeightSlider";

const Advanced = (props) => {
  const [metrics, setMetrics] = useState(props.task.ordered_metrics);

  const setMetricWeight = (field_name, newWeight, setFieldValue) => {
    setMetrics((state) => {
      const list = state.map((item, j) => {
        if (item.field_name === field_name) {
          return { ...item, default_weight: newWeight };
        } else {
          return item;
        }
      });
      setFieldValue("metrics", list);
      return list;
    });
  };
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">
        Advanced Settings
      </h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                annotation_config_json: props.task.annotation_config_json,
              }}
              onSubmit={props.handleTaskActivate}
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
                        controlId="annotation_config_json"
                        className="py-3 my-0"
                      >
                        <Row>
                          <Form.Label column>Task Configuration</Form.Label>
                          <Col sm="12">
                            <Form.Text
                              id="paramsHelpBlock"
                              muted
                              className="border-bottom"
                            >
                              <span style={{ color: "red" }}>BETA Notice</span>:
                              Once this task has been activated, the task
                              configuration can no longer be changed.
                            </Form.Text>
                          </Col>
                        </Row>
                        <Col sm="12" className="light-gray-bg">
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
                              defaultValue={values.annotation_config_json}
                              rows="24"
                              onChange={handleChange}
                              style={{ fontSize: 10 }}
                            />
                          )}
                        </Col>
                        <Form.Text id="paramsHelpBlock" muted>
                          DynaTask configuration strings are JSON objects that
                          specify the input/output format for dataset and model
                          submissions, as well as the fields in the create and
                          validation interfaces. See{" "}
                          <a href="https://github.com/facebookresearch/dynabench/blob/main/docs/owners.md">
                            here
                          </a>{" "}
                          for more documentation. Please contact support or open
                          a Github issue if you have any questions.
                        </Form.Text>
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
                        <Col sm="8">
                          <small className="form-text text-muted">
                            {errors.accept}
                          </small>
                        </Col>
                      </Form.Group>
                      <Row className="justify-content-md-center">
                        {dirty && !props.task.active ? (
                          <Button
                            type="submit"
                            variant="danger"
                            size="lg"
                            className="text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Save
                            <br />{" "}
                            <small>
                              (WARNING: You will not be able to change this
                              config while we're in beta)
                            </small>
                          </Button>
                        ) : null}
                      </Row>
                    </Container>
                  </form>
                </>
              )}
            </Formik>
          </Card.Body>
        </Card>
        <Card className="mt-4">
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                aggregation_metric_type: props.task.aggregation_metric,
                metrics: metrics,
              }}
              onSubmit={props.handleTaskAnnotationConfigUpdate}
            >
              {({
                values,
                errors,
                handleChange,
                handleSubmit,
                isSubmitting,
                setFieldValue,
                dirty,
              }) => (
                <form className="px-2 py-3 my-0" onSubmit={handleSubmit}>
                  <Container>
                    <Form.Group className="border-bottom">
                      <Form.Label>Edit Task Configuration</Form.Label>
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Aggregation Metric</Form.Label>
                    </Form.Group>
                    <Form.Group as={Row} controlId="aggregation_metric_type">
                      <Form.Label column sm="2">
                        Type
                      </Form.Label>
                      <Form.Control
                        as="select"
                        className="col-sm-10"
                        value={values.aggregation_metric_type}
                        onChange={handleChange}
                      >
                        <option key={1} value="dynascore">
                          dynascore
                        </option>
                        <option key={2} value="lol">
                          lol
                        </option>
                      </Form.Control>
                    </Form.Group>
                    <Row>
                      <Form.Label column sm="2">
                        Weights
                      </Form.Label>
                      <Row className="col-sm-10 d-flex flex-wrap">
                        {metrics.map((metric) => (
                          <Form.Group
                            as={Col}
                            controlId="default_weight"
                            className="col-sm-4"
                          >
                            <Form.Label className="text-center col-sm-12">
                              {metric.name}{" "}
                              <WeightIndicator weight={metric.default_weight} />
                            </Form.Label>
                            <WeightSlider
                              className="d-flex col-sm-12"
                              weight={metric.default_weight}
                              onWeightChange={(newWeight) =>
                                setMetricWeight(
                                  metric.field_name,
                                  newWeight,
                                  setFieldValue
                                )
                              }
                              ComponentType={Container}
                            />
                          </Form.Group>
                        ))}
                      </Row>
                    </Row>
                    <Button
                      type="submit"
                      variant="primary"
                      className="submit-btn button-ellipse text-uppercase my-4"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Spinner as="span" animation="border" size="sm" />
                      ) : (
                        "Save"
                      )}
                    </Button>
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

export default Advanced;
