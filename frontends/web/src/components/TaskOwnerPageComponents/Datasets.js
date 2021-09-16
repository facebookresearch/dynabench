/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import { Formik } from "formik";
import DragAndDrop from "../DragAndDrop/DragAndDrop";

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
  const delta_metric_configs = JSON.parse(
    props.task.annotation_config_json
  ).delta_metrics;
  const delta_files = {};
  for (const config of delta_metric_configs) {
    delta_files[config.type] = null;
  }
  return (
    <Container className="mb-5 pb-5">
      <h1 className="my-4 pt-3 text-uppercase text-center">Datasets</h1>
      <Col>
        <Card className="my-4">
          <Card.Body>
            <Formik
              initialValues={Object.assign(
                {
                  file: null,
                  name: "",
                },
                delta_files
              )}
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
                      <Form.Group as={Row} className="py-3 my-0 border-bottom">
                        <Form.Label column>
                          Add a new dataset by uploading it here. Files should
                          be a jsonl where each line has fields that match the
                          model inputs and outputs for your task.
                        </Form.Label>
                      </Form.Group>
                      <Form.Group
                        as={Row}
                        controlId="name"
                        className="py-3 my-0 border-bottom"
                      >
                        <Form.Label column>Name</Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            value={values.name}
                            onChange={handleChange}
                          />
                        </Col>
                      </Form.Group>
                      <Form.Group as={Row} className="py-3 my-0">
                        <Form.Label column>File</Form.Label>
                        <Col sm={8}>
                          <FileUpload
                            values={values}
                            filename={"file"}
                            setFieldValue={setFieldValue}
                          />
                        </Col>
                      </Form.Group>
                      {delta_metric_configs.map((config, index) => (
                        <Form.Group
                          key={index}
                          as={Row}
                          className="py-3 my-0 border-top"
                        >
                          <Form.Label column>File for {config.type}</Form.Label>
                          <Col sm={8}>
                            <FileUpload
                              values={values}
                              filename={config.type}
                              setFieldValue={setFieldValue}
                            />
                          </Col>
                        </Form.Group>
                      ))}
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
                          values.file &&
                          !delta_metric_configs
                            .map((config) => values[config.type])
                            .includes(null) &&
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
        {props.datasets
          .slice(0)
          .reverse()
          .map((dataset) => (
            <Card key={dataset.id} className="my-4 pt-3">
              <Card.Body className="mt-4">
                <Formik
                  enableReinitialize={true}
                  initialValues={{
                    id: dataset.id,
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
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>Name</Form.Label>
                            <Col sm="8">
                              <Form.Control
                                disabled
                                plaintext
                                defaultValue={dataset.name}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            controlId="source_url"
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>Link to Paper</Form.Label>
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
                            <Form.Label column>Access Type</Form.Label>
                            <Col sm="8">
                              <Form.Control
                                as="select"
                                onChange={handleChange}
                                value={values.access_type}
                              >
                                {props.availableAccessTypes.map(
                                  (type, index) => (
                                    <option key={index} value={type}>
                                      {type}
                                    </option>
                                  )
                                )}
                              </Form.Control>
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              Corresponds to a Round
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
                              <Form.Label column>Round</Form.Label>
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
                            <Form.Label column>Description</Form.Label>
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
      </Col>
    </Container>
  );
};

export default Datasets;
