/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";
import DragAndDrop from "../DragAndDrop/DragAndDrop";

const Datasets = (props) => {
  const changeCorrespondsToRound = (
    corresponds_to_round,
    default_rid,
    setFieldValue
  ) => {
    const updated_corresponds_to_round = !corresponds_to_round;
    setFieldValue("corresponds_to_round", updated_corresponds_to_round);
    if (updated_corresponds_to_round) {
      setFieldValue("rid", default_rid);
    } else {
      setFieldValue("rid", 0); //0 means that the dataset does not correspond to a round.
    }
  };
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Datasets</h1>
      <Col>
        {props.datasets.map((dataset) => (
          <Card key={dataset.id} className="my-4 pt-3">
            <Card.Body className="mt-4">
              <Formik
                enableReinitialize={true}
                initialValues={{
                  id: dataset.id,
                  name: dataset.name,
                  source_url: dataset.source_url,
                  corresponds_to_round: dataset.rid !== 0,
                  rid: dataset.rid,
                  access_type: dataset.access_type,
                  longdesc: dataset.longdesc,
                }}
                onSubmit={props.handleDatasetUpdate}
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
                  <>
                    <form className="px-4" onSubmit={handleSubmit}>
                      <Container>
                        <Form.Group
                          as={Row}
                          controlId="name"
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>
                            <b>Name</b>
                          </Form.Label>
                          <Col sm="8">
                            <Form.Control
                              onChange={handleChange}
                              defaultValue={values.name}
                            />
                          </Col>
                        </Form.Group>
                        <Form.Group
                          as={Row}
                          controlId="source_url"
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>
                            <b>Link to Paper</b>
                          </Form.Label>
                          <Col sm="8">
                            <Form.Control
                              onChange={handleChange}
                              defaultValue={values.source_url}
                            />
                          </Col>
                        </Form.Group>
                        <Form.Group
                          as={Row}
                          controlId="access_type"
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>
                            <b>Access Type</b>
                          </Form.Label>
                          <Col sm="8">
                            <Form.Control
                              as="select"
                              onChange={handleChange}
                              value={values.access_type}
                            >
                              {props.availableAccessTypes.map((type, index) => (
                                <option key={index} value={type}>
                                  {type}
                                </option>
                              ))}
                            </Form.Control>
                          </Col>
                        </Form.Group>
                        <Form.Group
                          as={Row}
                          className="py-3 my-0 border-bottom"
                        >
                          <Form.Label column>
                            <b>Corresponds to a Round</b>
                          </Form.Label>
                          <Col sm="8">
                            <Form.Check
                              checked={values.corresponds_to_round}
                              onClick={() =>
                                changeCorrespondsToRound(
                                  values.corresponds_to_round,
                                  props.task.cur_round,
                                  setFieldValue
                                )
                              }
                              onChange={handleChange}
                            />
                          </Col>
                        </Form.Group>
                        {values.corresponds_to_round ? (
                          <Form.Group
                            as={Row}
                            controlId="rid"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Round</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                type="number"
                                min={1}
                                max={props.task.cur_round}
                                step={1}
                                value={
                                  values.rid === 0
                                    ? props.task.cur_round
                                    : values.rid
                                }
                                onChange={handleChange}
                              />
                            </Col>
                          </Form.Group>
                        ) : null}
                        <Form.Group
                          as={Row}
                          controlId="longdesc"
                          className="py-3 my-0"
                        >
                          <Form.Label column>
                            <b>Description</b>
                          </Form.Label>
                          <Form.Control
                            rows="6"
                            as="textarea"
                            defaultValue={values.longdesc}
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
        ))}
        <Card className="my-4">
          <Card.Body>
            <Formik
              initialValues={{
                dataset_file: null,
                name: "",
              }}
              onSubmit={props.handleUploadAndCreateDataset}
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
                <>
                  <form className="px-4" onSubmit={handleSubmit}>
                    <Container>
                      <Form.Group
                        as={Row}
                        controlId="name"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>
                          <b>Name</b>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            value={values.name}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group className="py-3 my-0">
                        Add a new dataset by uploading the file here, as a jsonl
                        where each line has fields that match the model inputs
                        and outputs for your task. <br /> <br />
                        {values.dataset_file ? (
                          <div className="UploadResult">
                            <Card>
                              <Card.Body>
                                <Container>
                                  <Row>
                                    <Col md={10}>
                                      {values.dataset_file.name}
                                    </Col>
                                    <Col md={2}>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={(event) => {
                                          setFieldValue("dataset_file", null);
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
                                dataset_file: event.currentTarget.files[0],
                              });
                            }}
                          >
                            Drag
                          </DragAndDrop>
                        )}
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
                          {dirty &&
                          values.dataset_file &&
                          values.name !== "" ? (
                            <Button
                              type="submit"
                              variant="primary"
                              className="submit-btn button-ellipse text-uppercase my-4"
                              disabled={isSubmitting}
                            >
                              Add New Dataset
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

export default Datasets;
