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
                annotation_config_json: props.task.annotation_config_json,
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
                        controlId="validate_non_fooling"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Validate Non-Fooling Examples</b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Check
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
                          <b>
                            Show Anonymized Unpublished Models in Leaderboard
                          </b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Check
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
                        controlId="num_matching_validations"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>
                            Number of Matching Validations for an Example to be
                            Considered "Validated"
                          </b>
                        </Form.Label>
                        <Col sm="8">
                          <Form.Control
                            type="number"
                            min={0}
                            step={1}
                            defaultValue={values.num_matching_validations}
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

export default Settings;
