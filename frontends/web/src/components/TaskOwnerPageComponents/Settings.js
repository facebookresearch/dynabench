/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";

const Settings = (props) => {
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Settings</h1>
      <Col>
        <Card>
          <Card.Body className="mt-4">
            <Formik
              initialValues={{
                hidden: props.task.hidden,
                submitable: props.task.submitable,
                instructions_md: props.task.instructions_md,
                unpublished_models_in_leaderboard:
                  props.task.unpublished_models_in_leaderboard,
                num_matching_validations: props.task.num_matching_validations,
                validate_non_fooling: props.task.validate_non_fooling,
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
                      {!!!props.task.active && (
                        <div>
                          <span style={{ color: "red" }}>BETA Notice</span>:
                          Your task is not yet active. Please go to the Advanced
                          settings first to configure your task.
                        </div>
                      )}
                      <Form.Group
                        as={Row}
                        controlId="instructions_md"
                        className="py-3 my-0"
                      >
                        <Form.Label column>Instructions</Form.Label>
                        <Col sm="12">
                          <Form.Control
                            as="textarea"
                            disabled={!props.admin_or_owner}
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
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="hidden"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Hidden
                          <Form.Text id="paramsHelpBlock" muted>
                            Is this task publicly visible?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            disabled={!props.admin_or_owner}
                            checked={values.hidden}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="validate_non_fooling"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Validate Non-Fooling Examples
                          <Form.Text id="paramsHelpBlock" muted>
                            Do we only validate examples that fooled the model,
                            or all of them?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            disabled={!props.admin_or_owner}
                            checked={values.validate_non_fooling}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="unpublished_models_in_leaderboard"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Show Anonymized Unpublished Models in Leaderboard
                          <Form.Text id="paramsHelpBlock" muted>
                            Display all models, or only published ones?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            disabled={!props.admin_or_owner}
                            checked={values.unpublished_models_in_leaderboard}
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
                          Submitable
                          <Form.Text id="paramsHelpBlock" muted>
                            Does this task accept model submissions?
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Check
                            disabled={!props.admin_or_owner}
                            checked={values.submitable}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="num_matching_validations"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          Validation Consensus Minimum
                          <Form.Text id="paramsHelpBlock" muted>
                            Number of agreeing validations for an example to be
                            considered "validated"
                          </Form.Text>
                        </Form.Label>
                        <Col sm="6">
                          <Form.Control
                            type="number"
                            min={0}
                            step={1}
                            disabled={!props.admin_or_owner}
                            defaultValue={values.num_matching_validations}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
                        <Col sm="6">
                          <small className="form-text text-muted">
                            {errors.accept}
                          </small>
                        </Col>
                      </Form.Group>
                      <Row className="justify-content-md-center">
                        {dirty && props.admin_or_owner ? (
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

export default Settings;
