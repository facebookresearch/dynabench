/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import DragAndDrop from "../DragAndDrop/DragAndDrop";

const Contexts = (props) => {
  return (
    <Container>
      <Form.Group>
        Add new contexts by uploading them here, as a jsonl where each line has
        three fields: <br /> <br />
        <b>context</b>: a json-style dict with keys and values for each of the
        context components in your task's Annotation Config JSON.
        <br />
        <b>tag</b>: a string that associates this context with a set of other
        contexts <br />
        <b>metadata</b>: a dictionary in json format representing any other data
        that is useful to you <br /> <br />
        {props.values.contexts_file ? (
          <div className="UploadResult">
            <Card>
              <Card.Body>
                <Container>
                  <Row>
                    <Col md={10}>{props.values.contexts_file.name}</Col>
                    <Col md={2}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(event) => {
                          props.setFieldValue("contexts_file", null);
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
              props.setValues({
                ...props.values,
                contexts_file: event.currentTarget.files[0],
              });
            }}
            name="contexts_file"
          >
            Drag
          </DragAndDrop>
        )}
      </Form.Group>
    </Container>
  );
};

export default Contexts;
