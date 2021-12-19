/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useContext, useEffect, useState } from "react";
import { Container, Row, Form, Col, Card, Button } from "react-bootstrap";
import DragAndDrop from "../DragAndDrop/DragAndDrop";
import UserContext from "../../containers/UserContext";

const Contexts = (props) => {
  function fetchTags(tid, rid) {
    return context.api.getAllTaskTags(tid, rid);
  }

  useEffect(() => {
    let initStatus = tags.reduce((a, v) => ({ ...a, [v]: false }), {});
    let selectedTagObj = selectedTags.reduce(
      (a, v) => ({ ...a, [v]: true }),
      {}
    );
    Object.assign(initStatus, selectedTagObj);
    setTagStatus(initStatus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const context = useContext(UserContext);
  const [tags, setTags] = useState(props.allTaskTags);
  const [tagStatus, setTagStatus] = useState({});
  const [selectedTags, setSelectedTags] = useState(
    JSON.parse(props.task.round.selected_tags)
  );

  return (
    <Container>
      <Form.Group controlId="contexts_file">
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
          >
            Drag
          </DragAndDrop>
        )}
      </Form.Group>
      <p>
        You can also select the tags of the contexts you want to be shown in
        this round.
      </p>
      <Form.Group controlId="selected_tags">
        {Object.keys(tagStatus).map((key, index) => {
          let checked = tagStatus[key];
          return (
            <Form.Check
              type="checkbox"
              key={index}
              checked={checked}
              label={key}
              name="selected_tags"
              value={key}
              onChange={(event) => {
                // if (event.target.checked) {
                //   var newTags = [...selectedTags, event.target.value];
                //   setSelectedTags(newTags);
                // } else {
                //   var newTags = selectedTags.filter(
                //     (t) => t !== event.target.value
                //   );
                //   setSelectedTags(newTags);
                // }
                let newTagStatus = {
                  ...tagStatus,
                  [key]: event.target.checked,
                };
                setTagStatus(newTagStatus);
                props.setFieldValue("selected_tags", newTagStatus);
              }}
            />
          );
        })}
      </Form.Group>
    </Container>
  );
};

export default Contexts;
