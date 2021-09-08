/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";

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
                          defaultValue={values.model_wrong_metric_config_json}
                          onChange={handleChange}
                        />
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
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

export default Metrics;
