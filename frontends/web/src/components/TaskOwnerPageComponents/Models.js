/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";
import { Link } from "react-router-dom";

const Models = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Models</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                model_identifiers: props.model_identifiers,
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
                          <b>Model</b>
                        </Form.Label>
                        <Row className="align-items-center">
                          <Col>
                            <b>Round (check box to add model into the loop)</b>
                          </Col>
                        </Row>
                      </Form.Group>
                      {values.model_identifiers.map((model_identifier) => (
                        <Form.Group
                          as={Row}
                          controlId="hidden"
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>
                            <Link
                              to={`/models/${model_identifier.model_id}`}
                              className="btn-link"
                            >
                              {model_identifier.model_name}
                            </Link>{" "}
                            <Link
                              to={`/users/${model_identifier.uid}#profile`}
                              className="btn-link"
                            >
                              ({model_identifier.username})
                            </Link>
                          </Form.Label>
                          <Row className="align-items-center">
                            {model_identifier.is_target_for_round.map(
                              (is_target, round_index) => (
                                <Col>
                                  <Form.Check
                                    checked={is_target}
                                    onChange={handleChange}
                                  />
                                  {round_index + 1}
                                </Col>
                              )
                            )}
                          </Row>
                        </Form.Group>
                      ))}
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

export default Models;
